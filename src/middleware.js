// import { NextResponse } from "next/server";

// const MAIN_DOMAIN =
//   process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "yourplatform.com";

// const RESERVED_SUBDOMAINS = [
//   "www",
//   "app",
//   "api",
//   "admin",
//   "dashboard",
//   "auth",
// ];

// const PUBLIC_PATHS = ["/","/auth/login", "/auth/signup"];


// // ✅ ADD THIS — Prefixes that bypass auth entirely
// const PUBLIC_PREFIXES = [
//   "/tenant-site/editor/preview", // iframe preview needs no auth
//   "/tenant-site/",               // all public tenant sites
// ];

// const EXCLUDED_PATHS = ["/_next", "/api", "/favicon.ico"];

// export function middleware(req) {
//   const pathname = req.nextUrl.pathname;
//   const host = req.headers.get("host") || "";

  
//   // Block superadmin routes on non-admin domains
//   if (pathname.startsWith('/superadmin') && !host.startsWith('admin.')) {
//     return NextResponse.redirect(new URL('/', req.url));
//   }

//   // Skip excluded paths
//   if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) {
//     return NextResponse.next();
//   }

//     // ---------------------------------------------
//   // AUTH STATE FROM COOKIES
//   // ---------------------------------------------
//   const authToken = req.cookies.get("access_token")?.value;
//   const onboardingStep = req.cookies.get("onboarding_step")?.value;
//   const activeTenantId = req.cookies.get("active_tenant")?.value;


//   const isPublicPath =
//       PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)) ||
//       PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)); // ✅ ADD THIS

//     if (!authToken && !isPublicPath) {
//       const url = req.nextUrl.clone();
//       url.pathname = "/auth/login";
//       return NextResponse.redirect(url);
//     }

//   // ---------------------------------------------
//   // ONBOARDING REDIRECT (same logic as dashboard)
//   // ---------------------------------------------
//   if (
//     authToken &&
//     onboardingStep &&
//     Number(onboardingStep) > 0 &&
//     !pathname.startsWith("/auth/onboarding")
//   ) {
//     const url = req.nextUrl.clone();
//     url.pathname = `/auth/onboarding`;
//     url.searchParams.set("step", onboardingStep);
//     return NextResponse.redirect(url);
//   }


//   // ---------------------------------------------
//   // TENANT DOMAIN RESOLUTION
//   // ---------------------------------------------
//   let tenantDomain = null;
//   let subdomain = null;

//   // DEV: gptx.lvh.me:3000
//   if (host.endsWith(".lvh.me:3000")) {
//     subdomain = host.replace(".lvh.me:3000", "");

//     if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
//       tenantDomain = subdomain;
//     }
//   }

//   // PROD: gptx.yourplatform.com
//   else if (host.endsWith("." + MAIN_DOMAIN)) {
//     subdomain = host.replace("." + MAIN_DOMAIN, "");

//     if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
//       tenantDomain = subdomain;
//     }
//   }

//   // Custom domain
//   else if (!host.includes("localhost")) {
//     tenantDomain = host;
//   }

//   if (tenantDomain && !pathname.startsWith("/tenant-site")) {
//     const url = req.nextUrl.clone();
//     url.pathname = `/tenant-site/${tenantDomain}${pathname}`;
//     return NextResponse.rewrite(url);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/:path*"],
// };


// middleware.js  (UPDATED — adds custom domain verification via resolve API)

import { NextResponse } from "next/server";

const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "yourplatform.com";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "auth",
];

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup"];

const PUBLIC_PREFIXES = [
  "/tenant-site/editor/preview",
  "/tenant-site/",
];

const EXCLUDED_PATHS = ["/_next", "/api", "/favicon.ico"];

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get("host") || "";

  // Block superadmin routes on non-admin domains
  if (pathname.startsWith("/superadmin") && !host.startsWith("admin.")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Skip excluded paths
  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // -----------------------------------------
  // AUTH STATE FROM COOKIES
  // -----------------------------------------
  const authToken = req.cookies.get("access_token")?.value;
  const onboardingStep = req.cookies.get("onboarding_step")?.value;
  const activeTenantId = req.cookies.get("active_tenant")?.value;

  const isPublicPath =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!authToken && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // -----------------------------------------
  // ONBOARDING REDIRECT
  // -----------------------------------------
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

  // -----------------------------------------
  // TENANT DOMAIN RESOLUTION
  // -----------------------------------------
  let tenantDomain = null;
  let subdomain = null;
  let resolvedTenantId = null;
  let resolvedTenantSlug = null;

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

  // CUSTOM DOMAIN: mybusiness.com
  // Verify it's actually registered on our platform before rewriting
  else if (
    !host.includes("localhost") &&
    !host.includes("lvh.me") &&
    host !== MAIN_DOMAIN
  ) {
    // Strip port if present
    const cleanHost = host.includes(":") ? host.split(":")[0] : host;
    console.log(`[middleware] Resolving custom domain: ${cleanHost}`);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/public/resolve-domain/?domain=${encodeURIComponent(cleanHost)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3000),
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();

        if (data.resolved && data.is_verified) {
          // Domain is registered and verified → allow rewrite
          tenantDomain = data.tenant_slug; // 🔥 IMPORTANT FIX
          resolvedTenantId = data.tenant_id;
          resolvedTenantSlug = data.tenant_slug;
        } else {
          // Domain registered but NOT verified → show error
          const url = req.nextUrl.clone();
          url.pathname = "/domain-not-verified";
          return NextResponse.rewrite(url);
        }
      } else {
        // Domain not found on our platform → redirect to main site
        return NextResponse.redirect(
          new URL(`https://${MAIN_DOMAIN}`, req.url)
        );
      }
    } catch (err) {
      // API error / timeout → still allow rewrite (graceful degradation)
      // The tenant-site page will handle "domain not found" on its own
      console.error(
        `[middleware] resolve-domain failed for ${cleanHost}:`,
        err.message
      );
      tenantDomain = cleanHost;
    }
  }

  // -----------------------------------------
  // REWRITE TO TENANT SITE
  // -----------------------------------------
  if (tenantDomain && !pathname.startsWith("/tenant-site")) {
    const url = req.nextUrl.clone();
    url.pathname = `/tenant-site/${tenantDomain}${pathname}`;

    const response = NextResponse.rewrite(url);

    // Pass resolved tenant info downstream via headers
    // Pages can read these to skip redundant API lookups
    if (resolvedTenantId) {
      response.headers.set("x-tenant-id", resolvedTenantId);
    }
    if (resolvedTenantSlug) {
      response.headers.set("x-tenant-slug", resolvedTenantSlug);
    }
    if (tenantDomain) {
      response.headers.set("x-tenant-domain", tenantDomain);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};