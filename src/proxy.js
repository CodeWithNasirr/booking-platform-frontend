// src/proxy.js — Next.js middleware ("proxy" is the Next 16 name).
//
// Domain architecture (all env-driven; NO app.<domain> dependency):
//   1. Main SaaS app     → https://<MAIN_DOMAIN>            (apex; auth + tenant dashboard)
//      + www redirect    → https://www.<MAIN_DOMAIN>        (308 → apex)
//   2. Platform admin    → https://admin.<MAIN_DOMAIN>      (/superadmin/* isolated here)
//   3. Tenant subdomain  → https://<slug>.<MAIN_DOMAIN>     (public storefront)
//   4. Tenant custom dom → https://<customer-domain>        (resolved via backend)
//   5. Backend API       → NEXT_PUBLIC_API_URL              (separate origin)
//
// Ordering matters: tenant hosts are PUBLIC storefronts, so they are resolved
// and rewritten to /tenant-site/<slug>/... BEFORE the SaaS auth guard runs —
// otherwise an unauthenticated visitor to a tenant page would be bounced to
// the SaaS /auth/login.

import { NextResponse } from "next/server";

const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "localhost:3000";

const PROTOCOL = process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL || "https";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Subdomains that are NEVER tenants. "app" is here purely so app.<domain> is
// not mistaken for a tenant — the SaaS app itself lives on the apex, not app.*.
const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin", "dashboard", "auth"];

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup"];
const PUBLIC_PREFIXES = ["/tenant-site/editor/preview", "/tenant-site/"];
const EXCLUDED_PATHS = ["/_next", "/api", "/favicon.ico"];

// Pages allowed on the admin host outside /superadmin (template preview, etc.).
const ADMIN_ALLOWED_PUBLIC_ROUTES = [
  "/tenant-site/templates",
  "/tenant-site/editor/preview",
];

// Extract a tenant subdomain from a host, or null if it's the apex, a reserved
// subdomain, or not one of our platform hosts. Handles dev (lvh.me:3000).
function tenantSubdomain(host) {
  let sub = null;
  if (host.endsWith(".lvh.me:3000")) {
    sub = host.slice(0, -".lvh.me:3000".length);
  } else if (MAIN_DOMAIN && host.endsWith("." + MAIN_DOMAIN)) {
    sub = host.slice(0, -("." + MAIN_DOMAIN).length);
  }
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.includes(sub)) return null;
  return sub;
}

// Is this host one of our own platform hosts (apex / www / any *.MAIN_DOMAIN /
// local dev)? If so it is NEVER a custom domain.
function isPlatformHost(host, hostname) {
  if (hostname === "localhost" || host.includes("lvh.me")) return true;
  if (hostname === MAIN_DOMAIN) return true;
  if (MAIN_DOMAIN && host.endsWith("." + MAIN_DOMAIN)) return true;
  return false;
}

// Rewrite a tenant request to the internal /tenant-site/<slug> tree and pass
// the resolved identity downstream via headers (unchanged contract).
function rewriteToTenantSite(req, { slug, tenantId, tenantDomain }) {
  const url = req.nextUrl.clone();
  url.pathname = `/tenant-site/${slug}${req.nextUrl.pathname}`;
  const res = NextResponse.rewrite(url);
  if (tenantId) res.headers.set("x-tenant-id", tenantId);
  res.headers.set("x-tenant-slug", slug);
  res.headers.set("x-tenant-domain", tenantDomain || slug);
  return res;
}

export async function proxy(req) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const host = (req.headers.get("host") || "").toLowerCase();
  const hostname = host.split(":")[0];

  // 0. Static / framework / API passthrough — cheapest first.
  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 1. Canonicalize www → apex (preserve pathname + query). Prevents www from
  //    ever being handled as a separate app or a tenant.
  if (MAIN_DOMAIN && host === `www.${MAIN_DOMAIN}`) {
    return NextResponse.redirect(
      new URL(`${PROTOCOL}://${MAIN_DOMAIN}${pathname}${url.search}`),
      308,
    );
  }

  const isAdminHost = host.startsWith("admin.");

  // 2. Superadmin isolation — /superadmin/* only ever exists on the admin host.
  if (pathname.startsWith("/superadmin") && !isAdminHost) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Admin host isolation — everything except /superadmin, /auth and a small
  //    allow-list bounces to the superadmin dashboard.
  if (
    isAdminHost &&
    !pathname.startsWith("/superadmin") &&
    !pathname.startsWith("/auth") &&
    !ADMIN_ALLOWED_PUBLIC_ROUTES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/superadmin/dashboard", req.url));
  }

  // 4. TENANT HOSTS (public storefronts) — resolved BEFORE the SaaS auth guard.
  //    (a) Platform subdomain: <slug>.<MAIN_DOMAIN>
  const sub = tenantSubdomain(host);
  if (sub && !pathname.startsWith("/tenant-site")) {
    return rewriteToTenantSite(req, { slug: sub, tenantDomain: sub });
  }

  //    (b) Custom domain: anything that isn't one of our platform hosts.
  if (!isPlatformHost(host, hostname) && !pathname.startsWith("/tenant-site")) {
    const domainForLookup = hostname.replace(/^www\./, "");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/public/resolve-domain/?domain=${encodeURIComponent(domainForLookup)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3000),
          credentials: "include",
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.resolved && data.is_verified) {
          return rewriteToTenantSite(req, {
            slug: data.tenant_slug,
            tenantId: data.tenant_id,
            tenantDomain: data.tenant_slug,
          });
        }
        // Registered but not verified → show the verification-pending page.
        const notVerified = req.nextUrl.clone();
        notVerified.pathname = "/domain-not-verified";
        return NextResponse.rewrite(notVerified);
      }
      // Not registered on the platform → canonical main domain (never app.*).
      return NextResponse.redirect(new URL(`${PROTOCOL}://${MAIN_DOMAIN}`, req.url));
    } catch (err) {
      console.error("[proxy] resolve-domain failed:", err?.message);
      return NextResponse.redirect(new URL(`${PROTOCOL}://${MAIN_DOMAIN}`, req.url));
    }
  }

  // 5. MAIN SaaS APP (apex) or ADMIN host — authenticated application surface.
  const authToken =
    req.cookies.get("access_token")?.value ||
    req.cookies.get("platform_access_token")?.value;
  const onboardingStep = req.cookies.get("onboarding_step")?.value;

  const isPublicPath =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!authToken && !isPublicPath) {
    const login = req.nextUrl.clone();
    login.pathname = "/auth/login";
    return NextResponse.redirect(login);
  }

  // 6. Onboarding gate — finish onboarding before using the rest of the app.
  if (
    authToken &&
    onboardingStep &&
    Number(onboardingStep) > 0 &&
    !pathname.startsWith("/auth/onboarding")
  ) {
    const onboarding = req.nextUrl.clone();
    onboarding.pathname = "/auth/onboarding";
    onboarding.searchParams.set("step", onboardingStep);
    return NextResponse.redirect(onboarding);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
