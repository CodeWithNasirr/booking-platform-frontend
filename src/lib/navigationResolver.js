/**
 * navigationResolver.js
 *
 * Resolves a Website Builder navigation item (saved as JSON in layout_json)
 * to an actual href the renderer can use.
 *
 * Supported destination shapes (new):
 *   { destination: { type: "system_page",  page: "services" } }
 *   { destination: { type: "custom_page",  slug: "doctors" } }
 *   { destination: { type: "section",      section_id: "pricing" } }
 *   { destination: { type: "external",     url: "https://...", open_new_tab: true } }
 *
 * Legacy shape (still supported indefinitely):
 *   { url: "/services" }       → matched back to a system_page if known
 *   { url: "https://..." }     → treated as external
 *   { url: "#contact" }        → treated as anchor
 *
 * The resolver intentionally never prepends `/${domain}` — tenant resolution
 * is handled by the proxy middleware (see src/proxy.js).
 */

import { SYSTEM_PAGES } from "./systemPages";
import { tenantRoutes } from "./tenantRoutes";

const KNOWN_LEGACY_PATHS = {
  "/": "home",
  "/services": "services",
  "/my-bookings": "my_bookings",
  "/my-orders": "my_orders",
  "/my-requests": "my_requests",
  "/request-service": "request_service",
};

/**
 * Resolve a builder navigation item to a renderable href descriptor.
 *
 * @param {object} item        Nav item from layout JSON
 * @returns {{ href: string, isExternal: boolean, isAnchor: boolean, target?: string, rel?: string, requiresAuth?: boolean, ok: boolean }}
 */
export function resolveNavItem(item) {
  if (!item) return fallback();

  // ── New format: structured destination ──────────────────────────────────
  if (item.destination && typeof item.destination === "object") {
    return resolveDestination(item.destination);
  }

  // ── Legacy format: raw url string ───────────────────────────────────────
  if (typeof item.url === "string" && item.url.length) {
    return resolveLegacyUrl(item.url);
  }

  return fallback();
}

function resolveDestination(d) {
  switch (d.type) {
    case "system_page": {
      const sp = SYSTEM_PAGES[d.page];
      if (!sp) return fallback();
      return {
        href: sp.resolve(),
        isExternal: false,
        isAnchor: false,
        requiresAuth: !!sp.auth,
        ok: true,
      };
    }

    case "custom_page": {
      if (!d.slug) return fallback();
      return {
        href: tenantRoutes.customPage(d.slug),
        isExternal: false,
        isAnchor: false,
        ok: true,
      };
    }

    case "section": {
      if (!d.section_id) return fallback();
      return {
        href: `#${d.section_id}`,
        isExternal: false,
        isAnchor: true,
        ok: true,
      };
    }

    case "external": {
      if (!d.url) return fallback();
      const openNewTab = d.open_new_tab !== false; // default to true for external
      return {
        href: d.url,
        isExternal: true,
        isAnchor: false,
        target: openNewTab ? "_blank" : undefined,
        rel: openNewTab ? "noopener noreferrer" : undefined,
        ok: true,
      };
    }

    default:
      return fallback();
  }
}

function resolveLegacyUrl(url) {
  // Hash → anchor
  if (url.startsWith("#")) {
    return { href: url, isExternal: false, isAnchor: true, ok: true };
  }

  // Absolute URL → external
  if (/^https?:\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:")) {
    const isHttp = /^https?:\/\//i.test(url);
    return {
      href: url,
      isExternal: true,
      isAnchor: false,
      target: isHttp ? "_blank" : undefined,
      rel: isHttp ? "noopener noreferrer" : undefined,
      ok: true,
    };
  }

  // Defensive: strip any accidental `/${domain}/...` prefix written by older code.
  // We don't have the domain here, but we can detect the pattern: a known system
  // path appearing as the second segment of a 2-segment-or-deeper path.
  const stripped = stripDomainPrefixIfPresent(url);

  // Known system path → upgrade to system_page resolution (keeps behavior consistent
  // even if routes are later renamed in tenantRoutes.js)
  const systemKey = KNOWN_LEGACY_PATHS[stripped];
  if (systemKey) {
    return resolveDestination({ type: "system_page", page: systemKey });
  }

  // Internal path we don't recognize — treat as custom page / passthrough
  return {
    href: stripped,
    isExternal: false,
    isAnchor: false,
    ok: true,
  };
}

function stripDomainPrefixIfPresent(url) {
  // Pattern: /<segment>/<known-system-path>...   → /<known-system-path>...
  const m = url.match(/^\/[^/]+(\/(?:services|my-bookings|my-orders|my-requests|request-service)(\/.*)?)$/);
  return m ? m[1] : url;
}

function fallback() {
  return { href: "#", isExternal: false, isAnchor: false, ok: false };
}
