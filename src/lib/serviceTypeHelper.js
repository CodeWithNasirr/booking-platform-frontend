/**
 * serviceTypeHelper.js
 *
 * Centralized service-type classification and routing.
 *
 * Service types:
 *   "online"    → normal booking flow  (appointment / virtual_meeting)
 *   "digital"   → milestone/order page
 *   "order"     → milestone/order page
 *   "milestone" → milestone checkout flow
 *
 * The canonical field is `service.order_type`.
 * Legacy services may expose `service.service_type` or `service.booking_type` instead,
 * so we normalise once here and every consumer just calls the helpers.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Canonical type resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the normalised service type string.
 * Handles all legacy field names so the rest of the app doesn't have to.
 */
export function getServiceType(service) {
  if (!service) return null;

  const raw =
    service.order_type ||
    service.service_type ||
    service.booking_type 

  return raw.toLowerCase().trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Classification predicates
// ─────────────────────────────────────────────────────────────────────────────

/** True when the service should appear inside the normal booking flow. */
export function isBookableService(service) {
  const type = getServiceType(service);
  return type === "online" || type === "booking" || type === "appointment" || type === "virtual_meeting";
}

/** True when the service should route to a milestone / project checkout. */
export function isMilestoneService(service) {
  return getServiceType(service) === "milestone";
}

/** True when the service is a digital deliverable (one-off order). */
export function isDigitalService(service) {
  return getServiceType(service) === "digital";
}

/** True when the service is a generic order. */
export function isOrderService(service) {
  return getServiceType(service) === "order";
}

/** True for any service that should go through the milestone/order page. */
export function isProjectService(service) {
  const type = getServiceType(service);
  return ["digital", "order", "milestone"].includes(type);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Filtering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return only the services that belong in the normal booking flow.
 * Use this inside ServiceSelector / BookingModule.
 */
export function filterBookableServices(services = []) {
  return services.filter(isBookableService);
}

/**
 * Return only milestone / project-type services.
 */
export function filterProjectServices(services = []) {
  return services.filter(isProjectService);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Routing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a service, return the correct client-side route.
 *
 * @param {Object}  service
 * @param {string}  domain   – tenant domain slug (for tenant-site routes)
 * @returns {{ url: string, flow: "booking" | "milestone" | "order" }}
 */
export function getServiceRoute(service, domain = "") {
  const slug = service.slug || service.id;
  const type = getServiceType(service);
  const prefix = domain ? `/${domain}` : "";
  switch (type) {
    case "digital":
    case "order":
      return {
        url: `${prefix}/services/${slug}/order`,
        flow: "order",
      };

    case "booking":
      return {
        url: `${prefix}/services/${slug}/book`,
        flow: "booking",
      };

    default:
      return {
        url: `${prefix}/booking/service/${slug}`,
        flow: "booking",
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Display helpers
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 6. Billing & pricing helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isSubscriptionService(service) {
  const billing = service?.billing_type;
  return billing === "monthly" || billing === "yearly";
}

export function isCustomQuoteService(service) {
  return service?.pricing_type === "custom";
}

export function getServiceCTA(service, lang = "en") {
  if (isSubscriptionService(service)) {
    const labels = { en: "Subscribe", ar: "اشترك", ur: "سبسکرائب کریں" };
    return labels[lang] || labels.en;
  }
  if (isCustomQuoteService(service)) {
    const labels = { en: "Request Quote", ar: "اطلب عرض سعر", ur: "کوٹ کی درخواست کریں" };
    return labels[lang] || labels.en;
  }
  const type = getServiceType(service);
  const ctaMap = {
    booking: { en: "Book Now", ar: "احجز الآن", ur: "ابھی بک کریں" },
    online: { en: "Book Now", ar: "احجز الآن", ur: "ابھی بک کریں" },
    milestone: { en: "Start Project", ar: "ابدأ المشروع", ur: "پروجیکٹ شروع کریں" },
    digital: { en: "Order Now", ar: "اطلب الآن", ur: "ابھی آرڈر کریں" },
    order: { en: "Order Now", ar: "اطلب الآن", ur: "ابھی آرڈر کریں" },
  };
  const labels = ctaMap[type] || ctaMap.booking;
  return labels[lang] || labels.en;
}

/** Badge metadata keyed by canonical type. */
const BADGES = {
  online:    { labelKey: "Booking",  color: "bg-green-100 text-green-700" },
  booking:   { labelKey: "Booking",  color: "bg-green-100 text-green-700" },
  milestone: { labelKey: "Project",  color: "bg-purple-100 text-purple-700" },
  digital:   { labelKey: "Digital",  color: "bg-blue-100 text-blue-700" },
  order:     { labelKey: "Order",    color: "bg-orange-100 text-orange-700" },
};

const BILLING_BADGES = {
  monthly: { labelKey: "Monthly", color: "bg-indigo-100 text-indigo-700" },
  yearly:  { labelKey: "Yearly",  color: "bg-indigo-100 text-indigo-700" },
};

export function getServiceBadge(service) {
  if (isSubscriptionService(service)) {
    return BILLING_BADGES[service.billing_type] || BILLING_BADGES.monthly;
  }
  const type = getServiceType(service);
  return BADGES[type] || BADGES.online;
}