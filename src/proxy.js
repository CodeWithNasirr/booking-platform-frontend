// src/proxy.js — Next.js 16 middleware ("proxy" is the Next 16 name).
//
// Domain architecture (all env-driven):
//   1. Main SaaS app     → https://<MAIN_DOMAIN>          (apex; auth + dashboard)
//      www alias         → https://www.<MAIN_DOMAIN>      (308 → apex, ONE hop)
//   2. Platform admin    → https://admin.<MAIN_DOMAIN>    (/superadmin/* isolated)
//   3. Tenant subdomain  → https://<slug>.<MAIN_DOMAIN>   (public storefront)
//   4. Tenant custom dom → https://<customer-domain>      (resolved via backend)
//   5. Backend API       → NEXT_PUBLIC_API_URL            (separate origin)
//
// The apex is canonical. www redirects to the apex exactly once and the apex
// never redirects back — see normalizeMainDomain() (strips a stray leading
// "www." from the env so the redirect target can never be a www host, which is
// the classic ERR_TOO_MANY_REDIRECTS cause).

import { NextResponse } from "next/server";

const PROTOCOL = process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL || "https";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Canonical apex, hostname-only: no protocol, no leading "www.", no port,
// lowercase. Guarantees the www→apex redirect target is never itself a www host.
function normalizeMainDomain(raw) {
  return (raw || "localhost")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
}

const MAIN_DOMAIN = normalizeMainDomain(process.env.NEXT_PUBLIC_FRONTEND_DOMAIN);

// Subdomains that are NEVER tenants. "app" is reserved so app.<domain> is not
// mistaken for a tenant — the SaaS app lives on the apex, not app.*.
const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin", "dashboard", "auth"];

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup"];
const PUBLIC_PREFIXES = ["/tenant-site/editor/preview", "/tenant-site/"];
// Never touched by the middleware (framework internals + first-party API routes).
const EXCLUDED_PREFIXES = ["/_next", "/api", "/favicon.ico"];

const ADMIN_ALLOWED_PUBLIC_ROUTES = [
  "/tenant-site/templates",
  "/tenant-site/editor/preview",
];

// ── helpers ─────────────────────────────────────────────────────────────────

// Lowercased hostname, port + trailing dot stripped. Never contains a port, so
// it is safe to compare against MAIN_DOMAIN.
function normalizeHost(rawHost) {
  return (rawHost || "")
    .toLowerCase()
    .split(":")[0]
    .replace(/\.$/, "");
}

function isMainDomain(hostname) {
  // Apex only. Localhost is the dev apex.
  return hostname === MAIN_DOMAIN || hostname === "localhost";
}

function isAdminHost(hostname) {
  return hostname === `admin.${MAIN_DOMAIN}` || hostname.startsWith("admin.");
}

// True when the host is one of OUR platform hosts (apex, any *.MAIN_DOMAIN,
// localhost, *.lvh.me) — i.e. NOT an external custom domain.
function isPlatformHost(hostname) {
  return (
    hostname === MAIN_DOMAIN ||
    hostname.endsWith(`.${MAIN_DOMAIN}`) ||
    hostname === "localhost" ||
    hostname.endsWith(".lvh.me")
  );
}

// Tenant slug for <slug>.MAIN_DOMAIN (prod) or <slug>.lvh.me (dev), else null.
// Reserved subdomains and the apex are never tenants.
function getTenantSubdomain(hostname) {
  let sub = null;
  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    sub = hostname.slice(0, -(`.${MAIN_DOMAIN}`.length));
  } else if (hostname.endsWith(".lvh.me")) {
    sub = hostname.slice(0, -".lvh.me".length);
  }
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.includes(sub)) return null;
  return sub;
}

// Rewrite to the internal /tenant-site/<slug> tree, passing identity downstream.
function rewriteToTenantSite(req, { slug, tenantId, tenantDomain }) {
  const url = req.nextUrl.clone();
  url.pathname = `/tenant-site/${slug}${req.nextUrl.pathname}`;
  const res = NextResponse.rewrite(url);
  if (tenantId) res.headers.set("x-tenant-id", tenantId);
  res.headers.set("x-tenant-slug", slug);
  res.headers.set("x-tenant-domain", tenantDomain || slug);
  return res;
}

// ── middleware ──────────────────────────────────────────────────────────────

export async function proxy(req) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // A. Normalize hostname (lowercased, port-stripped).
  const hostname = normalizeHost(req.headers.get("host"));

  // B. Framework internals + first-party API routes — never redirect/rewrite.
  //    (Frontend→backend calls go to api.mzaya.io, a different origin, and
  //    never reach this middleware at all.)
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // C. Canonical www → apex (single 308, path + query preserved). The target is
  //    the normalized apex, so the apex never redirects back to www.
  if (hostname === `www.${MAIN_DOMAIN}`) {
    return NextResponse.redirect(
      new URL(`${PROTOCOL}://${MAIN_DOMAIN}${pathname}${url.search}`),
      308,
    );
  }

  // D. Admin isolation.
  //    D1. /superadmin/* only exists on the admin host; elsewhere → "/".
  if (pathname.startsWith("/superadmin") && !isAdminHost(hostname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  //    D2. On the admin host, everything except /superadmin, /auth and a small
  //        allow-list bounces to the superadmin dashboard.
  if (
    isAdminHost(hostname) &&
    !pathname.startsWith("/superadmin") &&
    !pathname.startsWith("/auth") &&
    !ADMIN_ALLOWED_PUBLIC_ROUTES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/superadmin/dashboard", req.url));
  }

  // E. Tenant subdomain → storefront rewrite (BEFORE the SaaS auth guard, since
  //    storefronts are public). Admin/apex/reserved never match here.
  if (!isAdminHost(hostname) && !isMainDomain(hostname)) {
    const sub = getTenantSubdomain(hostname);
    if (sub && !pathname.startsWith("/tenant-site")) {
      return rewriteToTenantSite(req, { slug: sub, tenantDomain: sub });
    }

    // F. Custom domain → resolve against the backend. Only for external hosts;
    //    all our own hosts are excluded by isPlatformHost().
    if (!isPlatformHost(hostname) && !pathname.startsWith("/tenant-site")) {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/v1/public/resolve-domain/?domain=${encodeURIComponent(hostname)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(3000),
            // Public endpoint — no browser cookies needed for server-side resolve.
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
          // Registered but unverified → verification-pending page.
          const notVerified = req.nextUrl.clone();
          notVerified.pathname = "/domain-not-verified";
          return NextResponse.rewrite(notVerified);
        }
        // Not registered → canonical main domain (never www, never app.*).
        return NextResponse.redirect(new URL(`${PROTOCOL}://${MAIN_DOMAIN}`, req.url));
      } catch (err) {
        console.error("[proxy] resolve-domain failed:", err?.message);
        return NextResponse.redirect(new URL(`${PROTOCOL}://${MAIN_DOMAIN}`, req.url));
      }
    }
  }

  // G. Main SaaS app (apex) / admin host — authenticated application surface.
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

  // H. Onboarding gate.
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

  // I. Everything else proceeds normally.
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
