/**
 * systemPages.js
 *
 * Catalog of every "system page" the Website Builder can link to.
 *
 * The builder UI reads SYSTEM_PAGES to populate its destination dropdown.
 * Tenants pick a page by name; the resolver looks up `resolve()` to get the
 * actual URL. This way tenants never type internal routes, and if a route
 * is renamed in tenantRoutes.js, every navigation item updates automatically.
 *
 * Add a new system page here when its Next.js route exists.
 */

import { tenantRoutes } from "./tenantRoutes";

export const SYSTEM_PAGES = {
  home: {
    key: "home",
    labels: { en: "Home", ar: "الرئيسية", ur: "ہوم" },
    icon: "Home",
    resolve: () => tenantRoutes.home(),
  },
  services: {
    key: "services",
    labels: { en: "Services", ar: "الخدمات", ur: "خدمات" },
    icon: "Grid3x3",
    resolve: () => tenantRoutes.services(),
  },
  request_service: {
    key: "request_service",
    labels: { en: "Request a Service", ar: "اطلب خدمة", ur: "سروس کی درخواست" },
    icon: "PlusCircle",
    resolve: () => tenantRoutes.requestService(),
  },
  my_bookings: {
    key: "my_bookings",
    labels: { en: "My Bookings", ar: "حجوزاتي", ur: "میری بکنگز" },
    icon: "Calendar",
    auth: true,
    resolve: () => tenantRoutes.myBookings(),
  },
  my_orders: {
    key: "my_orders",
    labels: { en: "My Orders", ar: "طلباتي", ur: "میرے آرڈرز" },
    icon: "Package",
    auth: true,
    resolve: () => tenantRoutes.myOrders(),
  },
  my_requests: {
    key: "my_requests",
    labels: { en: "My Custom Requests", ar: "طلباتي المخصصة", ur: "میری درخواستیں" },
    icon: "FileText",
    auth: true,
    resolve: () => tenantRoutes.myRequests(),
  },
};

export function listSystemPages({ includeAuthOnly = true } = {}) {
  return Object.values(SYSTEM_PAGES).filter((p) =>
    includeAuthOnly ? true : !p.auth
  );
}

export function getSystemPage(key) {
  return SYSTEM_PAGES[key] || null;
}

export function getSystemPageLabel(key, lang = "en") {
  const sp = SYSTEM_PAGES[key];
  if (!sp) return null;
  return sp.labels[lang] || sp.labels.en;
}
