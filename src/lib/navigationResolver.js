/**
 * navigationResolver.js
 *
 * Resolves a Website Builder navigation item (saved as JSON in layout_json)
 * to an actual href the renderer can use.
 *
 * All destination types live in destinationTypes.js. This file delegates
 * lookups to that registry — adding a new type means adding a registry
 * entry, not editing this file.
 *
 * Supported shapes:
 *   New (preferred):
 *     { destination: { type: "system_page", page: "services" } }
 *     { destination: { type: "service",     slug: "logo-design" } }
 *     { destination: { type: "external",    url: "https://...", open_new_tab: true } }
 *     { destination: { type: "email",       value: "hi@example.com" } }
 *     ...etc.
 *
 *   Legacy:
 *     { url: "/services" }      → mapped to a known system_page when possible
 *     { url: "https://..." }    → treated as external
 *     { url: "#contact" }       → treated as section anchor
 *
 * Paths returned are always BROWSER paths (no /${domain} prefix). The
 * proxy middleware (src/proxy.js) handles tenant resolution.
 */

import { DESTINATION_TYPES } from "./destinationTypes";
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
 * @returns {{ href: string, isExternal: boolean, isAnchor: boolean, target?: string, rel?: string, ok: boolean }}
 */
export function resolveNavItem(item) {
  if (!item) return fallback();

  if (item.destination && typeof item.destination === "object") {
    return resolveDestination(item.destination);
  }

  if (typeof item.url === "string" && item.url.length) {
    return resolveLegacyUrl(item.url);
  }

  return fallback();
}

function resolveDestination(d) {
  const def = DESTINATION_TYPES[d.type];
  if (!def) return fallback();

  const href = def.resolve(d) || "#";
  const isExternal = !!def.isExternal;
  const isAnchor = !!def.isAnchor;

  // External destinations default to opening in a new tab.
  // The "external" type respects open_new_tab; truly-external types
  // (whatsapp, maps) always open in a new tab.
  let openNewTab;
  if (d.type === "external") {
    openNewTab = d.open_new_tab !== false;
  } else {
    openNewTab = isExternal;
  }

  return {
    href,
    isExternal,
    isAnchor,
    target: openNewTab ? "_blank" : undefined,
    rel: openNewTab ? "noopener noreferrer" : undefined,
    ok: href !== "#",
  };
}

function resolveLegacyUrl(url) {
  if (url.startsWith("#")) {
    return { href: url, isExternal: false, isAnchor: true, ok: true };
  }

  if (/^mailto:/i.test(url)) return resolveDestination({ type: "email", value: url.replace(/^mailto:/i, "") });
  if (/^tel:/i.test(url))    return resolveDestination({ type: "phone", value: url.replace(/^tel:/i, "") });

  if (/^https?:\/\//i.test(url)) {
    return resolveDestination({ type: "external", url, open_new_tab: true });
  }

  const stripped = stripDomainPrefixIfPresent(url);
  const systemKey = KNOWN_LEGACY_PATHS[stripped];
  if (systemKey) return resolveDestination({ type: "system_page", page: systemKey });

  return { href: stripped, isExternal: false, isAnchor: false, ok: true };
}

/**
 * Defensive: strip any accidental `/${domain}/...` prefix written by older
 * code so legacy data still renders to the canonical bare path.
 */
function stripDomainPrefixIfPresent(url) {
  const m = url.match(
    /^\/[^/]+(\/(?:services|my-bookings|my-orders|my-requests|request-service)(\/.*)?)$/
  );
  return m ? m[1] : url;
}

function fallback() {
  return { href: "#", isExternal: false, isAnchor: false, ok: false };
}
