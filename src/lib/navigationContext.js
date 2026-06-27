/**
 * navigationContext.js
 *
 * Hook that loads the data a DestinationPicker (and any other navigation UI)
 * needs to populate its dropdowns:
 *
 *   - services   : tenant's published services        (used by `service` type)
 *   - categories : derived from services              (used by `service_category` type)
 *   - availability: per system-page boolean inferred
 *                  from existing services             (greys out unavailable system pages)
 *
 * No new backend endpoint: we reuse /api/v1/public-services/ which the
 * BookingModule already calls.
 *
 * The hook is intentionally tolerant — missing tenant domain returns empty
 * lists, fetch failures don't throw. The picker stays usable.
 */

"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Capability inference ───────────────────────────────────────────────────

/**
 * Given a flat services list, infer which system pages are "available"
 * for this tenant. Pages whose underlying module has no data become
 * available=false; the picker shows them but greyed out.
 */
export function inferAvailability(services = []) {
  const hasBookings = services.some((s) => s.order_type === "booking");
  const hasOrders = services.some(
    (s) => s.order_type === "order" || s.order_type === "digital"
  );
  const hasSubscriptions = services.some((s) =>
    ["monthly", "yearly"].includes(s.billing_type)
  );

  return {
    home: true,
    services: services.length > 0,
    request_service: true, // custom requests are tenant-opt-in via the section, always pickable
    my_bookings: hasBookings,
    my_orders: hasOrders,
    my_requests: true,
    my_subscriptions: hasSubscriptions,
  };
}

// ─── Category derivation ────────────────────────────────────────────────────

/**
 * Build a unique category list from the services payload. Each service has
 * a `category` object (or null) with { id, slug, name }. We dedupe by slug.
 */
export function deriveCategoriesFromServices(services = []) {
  const seen = new Map();
  for (const s of services) {
    const c = s.category;
    if (!c || !c.slug) continue;
    if (!seen.has(c.slug)) {
      seen.set(c.slug, {
        id: c.id || c.slug,
        slug: c.slug,
        name: c.name,
      });
    }
  }
  return Array.from(seen.values());
}

// ─── Hook ───────────────────────────────────────────────────────────────────

let _cachedFetch = null;

async function fetchPublicServices(domain) {
  if (!domain) return [];
  const res = await fetch(`${API_BASE}/api/v1/public-services/`, {
    headers: {
      "Content-Type": "application/json",
      "X-Tenant": domain,
    },
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.services || data.results || data || [];
}

/**
 * Load services + derived categories + availability for the picker.
 * Cached per domain for the session so repeated picker opens don't re-fetch.
 */
export function useNavigationContext(domain) {
  const [data, setData] = useState({
    services: [],
    categories: [],
    availability: {},
    loaded: false,
  });

  useEffect(() => {
    if (!domain) return;
    let cancelled = false;

    const cacheKey = `nav-ctx:${domain}`;
    if (_cachedFetch && _cachedFetch.domain === domain) {
      setData(_cachedFetch.data);
      return;
    }

    fetchPublicServices(domain)
      .then((services) => {
        if (cancelled) return;
        const next = {
          services,
          categories: deriveCategoriesFromServices(services),
          availability: inferAvailability(services),
          loaded: true,
        };
        _cachedFetch = { domain, data: next };
        setData(next);
      })
      .catch(() => {
        if (!cancelled) setData((d) => ({ ...d, loaded: true }));
      });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  return data;
}

/**
 * Invalidate the in-memory cache. Call this after the tenant publishes a
 * new service from the dashboard so the next picker open reflects it.
 */
export function invalidateNavigationContext() {
  _cachedFetch = null;
}
