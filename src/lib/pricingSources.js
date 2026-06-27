/**
 * pricingSources.js
 *
 * Normalizes any PricingTable data source (static / services / subscriptions)
 * to a unified PricingPlan[] that the renderer consumes.
 *
 * The PricingTable component itself never inspects raw service objects or
 * static plan JSON — it only knows how to render PricingPlan[]. Adding a
 * future source (e.g. tiered packages, recurring services) means adding
 * one normalizer here, not changing the component.
 *
 * PricingPlan shape:
 * {
 *   id, name, description, featured: boolean,
 *   price: { monthly: number|null, yearly: number|null,
 *            period_monthly, period_yearly, currency },
 *   features: (string|object)[],          // multilingual objects allowed
 *   badge: { text, color } | null,
 *   cta: { text, destination, url },      // resolved via resolveNavItem at render
 *   meta: { source, original_id }
 * }
 */

import { tenantRoutes } from "./tenantRoutes";

// ─── Static source ─────────────────────────────────────────────────────────

function normalizeStaticPlan(rawPlan, idx) {
  if (!rawPlan) return null;
  const id = rawPlan.id || `static-${idx}`;
  return {
    id,
    name: rawPlan.name || null,
    description: rawPlan.description || null,
    featured: !!(rawPlan.highlighted || rawPlan.recommended),
    price: {
      monthly: rawPlan.price_monthly ?? rawPlan.price ?? null,
      yearly: rawPlan.price_yearly ?? null,
      period_monthly: rawPlan.period_monthly || null,
      period_yearly: rawPlan.period_yearly || null,
      currency: rawPlan.currency || null,
    },
    features: rawPlan.features || [],
    badge: rawPlan.badge || (rawPlan.recommended ? { text: { en: "Recommended", ar: "موصى به", ur: "تجویز کردہ" } } : null),
    cta: {
      text: rawPlan.cta || rawPlan.cta_text || null,
      destination: rawPlan.cta_destination || null,
      url:
        rawPlan.cta_url ||
        (rawPlan.service_slug ? tenantRoutes.serviceOrder(rawPlan.service_slug) : null),
    },
    meta: { source: "static", original_id: id },
  };
}

// ─── Services source ───────────────────────────────────────────────────────

function normalizeServicePlan(service) {
  if (!service) return null;
  return {
    id: service.id || service.slug,
    name: service.name || service.title,
    description: service.short_description || service.description || null,
    featured: !!service.is_featured,
    price: {
      monthly: service.base_price ?? null,
      yearly: null,
      period_monthly: null,
      period_yearly: null,
      currency: service.currency || null,
    },
    features: extractServiceFeatures(service),
    badge: null,
    cta: {
      text: null, // PricingTable renders a default subscribe/order label
      destination: { type: "service", slug: service.slug },
      url: tenantRoutes.service(service.slug),
    },
    meta: { source: "service", original_id: service.id || service.slug },
  };
}

// ─── Subscriptions source ──────────────────────────────────────────────────

function normalizeSubscriptionPlan(service) {
  if (!service) return null;
  const billing = service.billing_type; // "monthly" | "yearly" | "one_time"
  const monthly = billing === "monthly" ? Number(service.base_price) : null;
  const yearly = billing === "yearly" ? Number(service.base_price) : null;

  return {
    id: service.id || service.slug,
    name: service.name || service.title,
    description: service.short_description || service.description || null,
    featured: !!service.is_featured,
    price: {
      monthly,
      yearly,
      period_monthly: { en: "/month", ar: "/شهر", ur: "/ماہ" },
      period_yearly: { en: "/year", ar: "/سنة", ur: "/سال" },
      currency: service.currency || "SAR",
    },
    features: extractServiceFeatures(service),
    badge:
      billing === "yearly"
        ? { text: { en: "Best Value", ar: "أفضل قيمة", ur: "بہترین ویلیو" } }
        : null,
    cta: {
      text: { en: "Subscribe", ar: "اشترك", ur: "سبسکرائب کریں" },
      // Goes to the dedicated subscribe flow, not the generic service detail
      url: tenantRoutes.serviceSubscribe(service.slug),
    },
    meta: {
      source: "subscription",
      original_id: service.id || service.slug,
      billing_type: billing,
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractServiceFeatures(service) {
  if (Array.isArray(service.features)) return service.features;
  if (Array.isArray(service.highlights)) return service.highlights;
  if (Array.isArray(service.packages)) {
    return service.packages.map((p) => p.name || p.title).filter(Boolean);
  }
  return [];
}

function selectServices(allServices, sourceCfg) {
  if (!Array.isArray(allServices) || !allServices.length) return [];

  let list = allServices.slice();

  // Filter by chosen IDs/slugs if provided
  const ids = (sourceCfg.service_ids || []).map(String);
  if (ids.length) {
    list = list.filter((s) =>
      ids.includes(String(s.id)) || ids.includes(String(s.slug))
    );
  }

  // Category filter
  if (sourceCfg.category_filter) {
    const cf = String(sourceCfg.category_filter);
    list = list.filter(
      (s) => String(s.category?.slug || "") === cf || String(s.category?.id || "") === cf
    );
  }

  if (sourceCfg.featured_only) {
    list = list.filter((s) => s.is_featured);
  }

  const max = sourceCfg.max_items || 6;
  return list.slice(0, max);
}

// ─── Public dispatcher ─────────────────────────────────────────────────────

/**
 * Resolve a PricingTable source spec into a normalized PricingPlan[].
 *
 * @param {object} source        content.source from the section data
 * @param {object} ctx           { allServices: Service[] }
 * @returns {PricingPlan[]}
 */
export function resolvePricingPlans(source, ctx = {}) {
  if (!source) return [];
  const services = ctx.allServices || [];

  switch (source.type) {
    case "static": {
      return (source.plans || [])
        .map((p, i) => normalizeStaticPlan(p, i))
        .filter(Boolean);
    }
    case "services": {
      return selectServices(services, source)
        .map(normalizeServicePlan)
        .filter(Boolean);
    }
    case "subscriptions": {
      const subscribable = services.filter((s) =>
        ["monthly", "yearly"].includes(s.billing_type)
      );
      return selectServices(subscribable, source)
        .map(normalizeSubscriptionPlan)
        .filter(Boolean);
    }
    default:
      return [];
  }
}

/**
 * Backward compatibility shim: layouts saved before this refactor have
 * `plans: [...]` at the section root and no `source` field. Treat them as
 * { type: "static", plans }.
 */
export function ensurePricingSource(content) {
  if (content?.source) return content.source;
  if (Array.isArray(content?.plans) && content.plans.length) {
    return { type: "static", plans: content.plans };
  }
  return { type: "static", plans: [] };
}
