/**
 * destinationTypes.js
 *
 * Single source of truth for every navigation destination type that the
 * Website Builder can save and the published site can render.
 *
 * Each entry declares:
 *   - key:        stable machine ID (saved in layout_json)
 *   - labels:     multilingual display name (editor + tabs)
 *   - icon:       lucide-react icon component (editor)
 *   - picker:     declarative description of the editor control:
 *                   { type: "dropdown", listChoices(ctx), valueField, searchable? }
 *                   { type: "url",      placeholder, extras: ["open_new_tab"] }
 *                   { type: "text",     inputType: "email"|"tel"|"text", placeholder }
 *   - resolve(d): returns the href string for a saved destination
 *   - isExternal: tells the renderer to add target/rel
 *   - isAnchor:   tells the renderer the href is a hash anchor
 *
 * The picker UI and the resolveNavItem function both iterate this map.
 * Adding a new type = one new entry. No switch statements to update.
 */

import {
  Home,
  Grid3x3,
  LayoutList,
  FileText,
  Package,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
} from "lucide-react";

import { tenantRoutes } from "./tenantRoutes";
import { SYSTEM_PAGES, listSystemPages } from "./systemPages";

// ─── Helpers ────────────────────────────────────────────────────────────────

const sanitizePhone = (v) => (typeof v === "string" ? v.replace(/[^\d+]/g, "") : "");
const sanitizeWhatsApp = (v) => (typeof v === "string" ? v.replace(/\D/g, "") : "");

// ─── Registry ───────────────────────────────────────────────────────────────

export const DESTINATION_TYPES = {
  system_page: {
    key: "system_page",
    labels: { en: "System Page", ar: "صفحة النظام", ur: "سسٹم پیج" },
    icon: Home,
    group: "internal",
    picker: {
      type: "dropdown",
      valueField: "page",
      listChoices: (ctx, lang = "en") =>
        listSystemPages().map((sp) => ({
          value: sp.key,
          label: sp.labels?.[lang] || sp.labels?.en || sp.key,
          auth: !!sp.auth,
          available: ctx?.availability?.[sp.key] !== false,
        })),
    },
    resolve: (d) => {
      const sp = SYSTEM_PAGES[d.page];
      return sp ? sp.resolve() : "#";
    },
  },

  custom_page: {
    key: "custom_page",
    labels: { en: "Custom Page", ar: "صفحة مخصصة", ur: "حسب ضرورت صفحہ" },
    icon: FileText,
    group: "internal",
    picker: {
      type: "dropdown",
      valueField: "slug",
      emptyHint: { en: "No custom pages yet", ar: "لا توجد صفحات", ur: "کوئی صفحہ نہیں" },
      listChoices: (ctx, lang = "en") =>
        (ctx?.customPages || []).map((p) => ({
          value: p.slug,
          label:
            (typeof p.title === "object" ? p.title[lang] || p.title.en : p.title) ||
            p.slug,
        })),
    },
    resolve: (d) => (d.slug ? tenantRoutes.customPage(d.slug) : "#"),
  },

  section: {
    key: "section",
    labels: { en: "Section on Home", ar: "قسم على الصفحة الرئيسية", ur: "ہوم پر سیکشن" },
    icon: LayoutList,
    group: "internal",
    isAnchor: true,
    picker: {
      type: "dropdown",
      valueField: "section_id",
      emptyHint: { en: "No sections in layout", ar: "لا توجد أقسام", ur: "کوئی سیکشن نہیں" },
      listChoices: (ctx) =>
        (ctx?.sections || []).map((s) => ({
          value: s.id || s.section_type,
          label: s.label || s.section_type,
        })),
    },
    // Always a hash on the homepage so a header link works from any page
    resolve: (d) => (d.section_id ? `${tenantRoutes.home()}#${d.section_id}` : "#"),
  },

  service: {
    key: "service",
    labels: { en: "Service", ar: "خدمة", ur: "سروس" },
    icon: Package,
    group: "internal",
    picker: {
      type: "dropdown",
      valueField: "slug",
      searchable: true,
      emptyHint: { en: "No services yet", ar: "لا توجد خدمات", ur: "کوئی سروس نہیں" },
      listChoices: (ctx, lang = "en") =>
        (ctx?.services || []).map((s) => ({
          value: s.slug,
          label:
            (typeof s.name === "object" ? s.name[lang] || s.name.en : s.name) ||
            s.slug,
        })),
    },
    resolve: (d) => (d.slug ? tenantRoutes.service(d.slug) : "#"),
  },

  service_category: {
    key: "service_category",
    labels: { en: "Service Category", ar: "فئة الخدمة", ur: "خدمت کیٹیگری" },
    icon: Grid3x3,
    group: "internal",
    picker: {
      type: "dropdown",
      valueField: "slug",
      emptyHint: { en: "No categories yet", ar: "لا توجد فئات", ur: "کوئی کیٹیگری نہیں" },
      listChoices: (ctx, lang = "en") =>
        (ctx?.categories || []).map((c) => ({
          value: c.slug,
          label:
            (typeof c.name === "object" ? c.name[lang] || c.name.en : c.name) ||
            c.slug,
        })),
    },
    resolve: (d) =>
      d.slug ? `${tenantRoutes.services()}?category=${encodeURIComponent(d.slug)}` : tenantRoutes.services(),
  },

  external: {
    key: "external",
    labels: { en: "External URL", ar: "رابط خارجي", ur: "بیرونی URL" },
    icon: ExternalLink,
    group: "external",
    isExternal: true,
    picker: {
      type: "url",
      placeholder: "https://...",
      extras: ["open_new_tab"],
    },
    resolve: (d) => d.url || "#",
  },

  email: {
    key: "email",
    labels: { en: "Email", ar: "بريد إلكتروني", ur: "ای میل" },
    icon: Mail,
    group: "contact",
    picker: {
      type: "text",
      inputType: "email",
      valueField: "value",
      placeholder: "name@example.com",
    },
    resolve: (d) => (d.value ? `mailto:${d.value}` : "#"),
  },

  phone: {
    key: "phone",
    labels: { en: "Phone", ar: "هاتف", ur: "فون" },
    icon: Phone,
    group: "contact",
    picker: {
      type: "text",
      inputType: "tel",
      valueField: "value",
      placeholder: "+1 555 000 0000",
    },
    resolve: (d) => (d.value ? `tel:${sanitizePhone(d.value)}` : "#"),
  },

  whatsapp: {
    key: "whatsapp",
    labels: { en: "WhatsApp", ar: "واتساب", ur: "واٹس ایپ" },
    icon: MessageCircle,
    group: "contact",
    isExternal: true,
    picker: {
      type: "text",
      inputType: "tel",
      valueField: "value",
      placeholder: "+1 555 000 0000",
    },
    resolve: (d) => (d.value ? `https://wa.me/${sanitizeWhatsApp(d.value)}` : "#"),
  },

  maps: {
    key: "maps",
    labels: { en: "Google Maps", ar: "خرائط جوجل", ur: "گوگل میپس" },
    icon: MapPin,
    group: "contact",
    isExternal: true,
    picker: {
      type: "text",
      inputType: "text",
      valueField: "value",
      placeholder: "Address or place name",
    },
    resolve: (d) =>
      d.value ? `https://maps.google.com/?q=${encodeURIComponent(d.value)}` : "#",
  },
};

// ─── Public helpers ─────────────────────────────────────────────────────────

export function listDestinationTypes() {
  return Object.values(DESTINATION_TYPES);
}

export function getDestinationType(key) {
  return DESTINATION_TYPES[key] || null;
}

/**
 * Compute the legacy `url` field for a destination, used as a fallback
 * for older renderers that haven't been migrated to resolveNavItem.
 */
export function computeLegacyUrl(destination) {
  const def = destination && DESTINATION_TYPES[destination.type];
  if (!def) return "#";
  try {
    return def.resolve(destination) || "#";
  } catch {
    return "#";
  }
}
