import { NextResponse } from "next/server";

const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "yourplatform.com";

const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "auth",
];

const PUBLIC_PATHS = ["/","/auth/login", "/auth/signup"];


// ✅ ADD THIS — Prefixes that bypass auth entirely
const PUBLIC_PREFIXES = [
  "/tenant-site/editor/preview", // iframe preview needs no auth
  "/tenant-site/",               // all public tenant sites
];

const EXCLUDED_PATHS = ["/_next", "/api", "/favicon.ico"];

export function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get("host") || "";

  
  // Block superadmin routes on non-admin domains
  if (pathname.startsWith('/superadmin') && !host.startsWith('admin.')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Skip excluded paths
  if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

    // ---------------------------------------------
  // AUTH STATE FROM COOKIES
  // ---------------------------------------------
  const authToken = req.cookies.get("access_token")?.value;
  const onboardingStep = req.cookies.get("onboarding_step")?.value;
  const activeTenantId = req.cookies.get("active_tenant")?.value;


  const isPublicPath =
      PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)) ||
      PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)); // ✅ ADD THIS

    if (!authToken && !isPublicPath) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

  // ---------------------------------------------
  // ONBOARDING REDIRECT (same logic as dashboard)
  // ---------------------------------------------
  if (
    authToken &&
    onboardingStep &&
    Number(onboardingStep) > 0 &&
    !pathname.startsWith("/auth/onboarding")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/auth/onboarding`;
    url.searchParams.set("step", onboardingStep);
    return NextResponse.redirect(url);
  }


  // ---------------------------------------------
  // TENANT DOMAIN RESOLUTION
  // ---------------------------------------------
  let tenantDomain = null;
  let subdomain = null;

  // DEV: gptx.lvh.me:3000
  if (host.endsWith(".lvh.me:3000")) {
    subdomain = host.replace(".lvh.me:3000", "");

    if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
      tenantDomain = subdomain;
    }
  }

  // PROD: gptx.yourplatform.com
  else if (host.endsWith("." + MAIN_DOMAIN)) {
    subdomain = host.replace("." + MAIN_DOMAIN, "");

    if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
      tenantDomain = subdomain;
    }
  }

  // Custom domain
  else if (!host.includes("localhost")) {
    tenantDomain = host;
  }

  if (tenantDomain && !pathname.startsWith("/tenant-site")) {
    const url = req.nextUrl.clone();
    url.pathname = `/tenant-site/${tenantDomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
