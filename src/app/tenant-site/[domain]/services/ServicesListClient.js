// src/app/tenant-site/[domain]/services/ServicesListClient.js
"use client";

/**
 * ServicesListClient — customer-facing service marketplace.
 *
 * Rebuilt (Phase 10) into a premium, tenant-branded listing that shares
 * the customer-portal design language (Bookings / Orders / Requests):
 *   - PortalBrandRoot bridges the tenant accent into the Phase-1 semantic
 *     tokens, so every primitive (bg-primary, ring-ring …) renders in the
 *     business's colour — no hard-coded blue/maroon.
 *   - Branded page header (logo + name), search, horizontally scrollable
 *     category filters, a responsive card grid, and clean empty states.
 *
 * Data, routing and i18n are UNCHANGED — only the presentation was rebuilt.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Star, ArrowRight, Truck, X, Package } from "lucide-react";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated } from "../utils/resolveTranslated";
import LayoutRenderer from "../LayoutRenderer";
import PortalBrandRoot, { getTenantBrand } from "@/app/tenant-site/components/portalBrand";
import {
  getServiceRoute,
  getServiceCTA,
  getServiceBadge,
  isCustomQuoteService,
} from "@/lib/serviceTypeHelper";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { formatCurrency } from "@/lib/currency";

function initials(name) {
  if (!name) return "•";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function catName(cat, lang) {
  if (!cat) return "";
  return typeof cat === "object" ? resolveTranslated(cat.name, lang) : cat.name || cat;
}

export default function ServicesListClient({
  services = [],
  domain,
  site,
  header,
  footer,
}) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = language;
  const brand = getTenantBrand(site);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const t = (obj) => resolveTranslated(obj, lang);

  // Unique categories
  const categories = useMemo(() => {
    const cats = new Map();
    services.forEach((s) => {
      if (s.category) {
        const catId = s.category.id || s.category.slug || "uncategorized";
        cats.set(catId, catName(s.category, lang));
      }
    });
    return Array.from(cats, ([id, name]) => ({ id, name }));
  }, [services, lang]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (categoryFilter !== "all") {
        const catId = s.category?.id || s.category?.slug;
        if (catId !== categoryFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = resolveTranslated(s.name, lang).toLowerCase();
        const desc = resolveTranslated(s.short_description || s.description, lang).toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [services, categoryFilter, search, lang]);

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && (
        <LayoutRenderer sections={headerSection} language={lang} site={site} />
      )}

      <PortalBrandRoot site={site} as="main" dir={isRTL ? "rtl" : "ltr"} className={`min-h-screen bg-muted ${isRTL ? "rtl" : ""}`}>
        {/* ── Branded header band ── */}
        <div className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex items-center gap-3">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name || "Logo"} className="h-10 w-10 rounded-xl object-cover shrink-0" />
              ) : brand.name ? (
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">{initials(brand.name)}</div>
              ) : null}
              <div className="min-w-0">
                {brand.name && <p className="text-xs text-muted-foreground truncate">{brand.name}</p>}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {t({ en: "Our Services", ar: "خدماتنا", ur: "ہماری خدمات" })}
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl">
              {t({
                en: "Browse our services and book or order in a few taps.",
                ar: "تصفح خدماتنا واحجز أو اطلب في بضع نقرات.",
                ur: "ہماری خدمات دیکھیں اور چند کلک میں بک یا آرڈر کریں۔",
              })}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* ── Toolbar: search + categories ── */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t({ en: "Search services…", ar: "بحث عن خدمات…", ur: "خدمات تلاش کریں…" })}
                className="w-full h-11 bg-input-background border border-border rounded-xl ps-9 pe-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t({ en: "Clear search", ar: "مسح البحث", ur: "تلاش صاف کریں" })}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <FilterPill active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} label={t({ en: "All", ar: "الكل", ur: "سب" })} />
                {categories.map((cat) => (
                  <FilterPill key={cat.id} active={categoryFilter === cat.id} onClick={() => setCategoryFilter(cat.id)} label={cat.name} />
                ))}
              </div>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground mt-4 mb-5">
            {filtered.length} {t({ en: "services", ar: "خدمة", ur: "خدمات" })}
          </p>

          {/* Grid / empty */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filtered.map((service) => (
                <MarketplaceCard key={service.id} service={service} lang={lang} theme={theme} isRTL={isRTL} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {t({ en: "No services found", ar: "لم يتم العثور على خدمات", ur: "کوئی خدمات نہیں ملیں" })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || categoryFilter !== "all"
                  ? t({ en: "Try a different search or category.", ar: "جرّب بحثًا أو فئة مختلفة.", ur: "مختلف تلاش یا زمرہ آزمائیں۔" })
                  : t({ en: "Services will appear here soon.", ar: "ستظهر الخدمات هنا قريبًا.", ur: "خدمات جلد یہاں ظاہر ہوں گی۔" })}
              </p>
              {(search || categoryFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                  className="inline-flex items-center gap-1.5 h-9 px-4 mt-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition"
                >
                  {t({ en: "Clear filters", ar: "مسح الفلاتر", ur: "فلٹرز صاف کریں" })}
                </button>
              )}
            </div>
          )}
        </div>
      </PortalBrandRoot>

      {footerSection.length > 0 && (
        <LayoutRenderer sections={footerSection} language={lang} site={site} />
      )}
    </>
  );
}

function FilterPill({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
        active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function MarketplaceCard({ service, lang, theme, isRTL }) {
  const t = (obj) => resolveTranslated(obj, lang);
  const currency = service.currency || theme?.default_currency || "SAR";
  const name = t(service.name);
  const description = t(service.short_description || service.description);
  const image = service.image || service.image_url;
  const slug = service.slug;

  const packages = service.packages || [];
  const rawPrice = service.price ?? service.base_price;
  const price = rawPrice ? Number(rawPrice) : null;
  const startingPrice = packages.length > 0 ? Math.min(...packages.map((p) => Number(p.price))) : price;
  const duration = service.duration_minutes;
  const deliveryDays = service.default_delivery_days;
  const rating = Number(service.average_rating || 0);
  const reviews = service.total_reviews || 0;
  const providerName = service.provider_name || service.provider?.name;

  const badge = getServiceBadge(service);
  const detailUrl = `/services/${slug}/`;
  const route = ["monthly", "yearly"].includes(service.billing_type)
    ? { url: tenantRoutes.serviceSubscribe(slug) }
    : isCustomQuoteService(service)
    ? { url: tenantRoutes.requestService() }
    : getServiceRoute(service);
  const ctaText = getServiceCTA(service, lang);

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition hover:shadow-md focus-within:ring-2 focus-within:ring-ring/40">
      {/* Media */}
      <Link href={detailUrl} className="block relative outline-none" tabIndex={-1}>
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-8 h-8" />
            </div>
          )}
        </div>
        {badge && (
          <span className={`absolute top-3 ${isRTL ? "end-3" : "start-3"} px-2.5 py-1 text-[11px] font-semibold rounded-full backdrop-blur-sm ${badge.color}`}>
            {badge.labelKey}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {service.category && (
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {catName(service.category, lang)}
          </span>
        )}
        <h3 className="mt-1">
          <Link href={detailUrl} className="text-base font-semibold text-foreground line-clamp-2 outline-none hover:text-primary focus-visible:text-primary transition-colors">
            {name}
          </Link>
        </h3>
        {description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">{description}</p>}

        {/* Meta */}
        <div className="flex items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground flex-wrap">
          {rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {reviews > 0 && <span>({reviews})</span>}
            </span>
          )}
          {duration > 0 && (
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{duration}m</span>
          )}
          {deliveryDays > 0 && (
            <span className="inline-flex items-center gap-1"><Truck className="w-3.5 h-3.5" />{deliveryDays}d</span>
          )}
        </div>

        {providerName && (
          <p className="text-xs text-muted-foreground mt-2 truncate">
            {t({ en: "by", ar: "بواسطة", ur: "بذریعہ" })} <span className="text-foreground font-medium">{providerName}</span>
          </p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-auto border-t border-border">
          {startingPrice > 0 ? (
            <div className="min-w-0">
              {packages.length > 0 && (
                <span className="block text-[10px] text-muted-foreground">
                  {t({ en: "Starting at", ar: "يبدأ من", ur: "شروع از" })}
                </span>
              )}
              <span className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(startingPrice, currency)}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t({ en: "Custom quote", ar: "عرض مخصص", ur: "حسب ضرورت" })}</span>
          )}

          <Link
            href={route.url}
            className="inline-flex items-center gap-1 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {ctaText}
            <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    </div>
  );
}
