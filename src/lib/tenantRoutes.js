/**
 * tenantRoutes.js
 *
 * Single source of truth for every internal client-side path inside a tenant site.
 *
 * IMPORTANT: paths here are bare paths (no `/${domain}` prefix).
 * Tenant resolution is done by the proxy middleware (src/proxy.js) which
 * rewrites `tenant.example.com/services` to `/tenant-site/{slug}/services`
 * internally. Client code (Link/router.push) must use the BROWSER path,
 * never the internal Next.js path.
 *
 * If a route is ever renamed (e.g. /my-orders → /account/orders), change it
 * here once and the whole app follows.
 */

export const tenantRoutes = {
  // ── Public site ───────────────────────────────────────────────────────────
  home: () => "/",
  customPage: (slug) => `/${slug}`,

  // ── Services ──────────────────────────────────────────────────────────────
  services: () => "/services",
  service: (slug) => `/services/${slug}`,
  serviceBook: (slug) => `/services/${slug}/book`,
  serviceOrder: (slug) => `/services/${slug}/order`,
  serviceSubscribe: (slug) => `/services/${slug}/subscribe`,

  // ── Booking flow ──────────────────────────────────────────────────────────
  bookingByService: (slug) => `/booking/service/${slug}`,
  bookingById: (id) => `/booking/id/${id}`,

  // ── Custom requests ───────────────────────────────────────────────────────
  requestService: () => "/request-service",

  // ── Customer area (auth required) ─────────────────────────────────────────
  myBookings: () => "/my-bookings",
  myBooking: (id) => `/my-bookings/${id}`,
  myOrders: () => "/my-orders",
  myOrder: (id) => `/my-orders/${id}`,
  myRequests: () => "/my-requests",
  mySubscriptions: () => "/my-subscriptions",
};
