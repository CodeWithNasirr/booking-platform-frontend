// lib/cookieConfig.js
//
// Shared options for the app's auth cookies (js-cookie, client-side).
//
// The cookie domain is env-driven (NEXT_PUBLIC_COOKIE_DOMAIN, e.g.
// ".neoleap.ai") so a new deployment/owner is never tied to a hardcoded
// domain. A leading-dot domain scopes the cookie to the apex + every
// subdomain (www / admin / <tenant-slug>), which the admin→app impersonation
// handoff relies on. When the var is unset (local dev on lvh.me/localhost)
// no domain is set, so cookies stay host-scoped and dev keeps working.

const isProd = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || "";

export const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  secure: isProd,
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
};
