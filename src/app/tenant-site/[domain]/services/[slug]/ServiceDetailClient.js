// src/app/tenant-site/[domain]/services/[slug]/ServiceDetailClient.js
"use client";

/**
 * ServiceDetailClient — premium service-detail page.
 *
 * Calendly / Fiverr-style layout:
 *   LEFT   — hero, description, packages, add-ons, requirements, session info
 *   RIGHT  — sticky sidebar with price + CTA (desktop)
 *   MOBILE — inline price + CTA and a sticky bottom action bar
 *
 * Rebuilt (Phase 10) onto the tenant-branded portal design language:
 * PortalBrandRoot bridges the tenant accent into the Phase-1 semantic
 * tokens, so no colour is hard-coded. Data, routing, pricing and the
 * package/add-on selectors are UNCHANGED.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { Star, Clock, ChevronRight } from "lucide-react";

import { useTenantLang } from "@/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "@/app/tenant-site/contexts/TenantThemeContext";
import resolveTranslated from "../../utils/resolveTranslated";
import {
  getServiceRoute,
  getServiceType,
  getServiceBadge,
} from "@/lib/serviceTypeHelper";
import { formatCurrency } from "@/lib/currency";

import LayoutRenderer from "../../LayoutRenderer";
import PortalBrandRoot from "@/app/tenant-site/components/portalBrand";
import PackageSelector from "@/components/services/PackageSelector";
import AddonSelector from "@/components/services/AddonSelector";
import ServiceSidebar from "@/components/services/ServiceSidebar";

// Module-level so its identity is stable across package/add-on selection
// re-renders (avoids remounting the selectors inside it).
function Section({ title, children }) {
  return (
    <section className="bg-card rounded-2xl border border-border p-6 sm:p-8">
      <h2 className="text-lg font-bold text-foreground mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function ServiceDetailClient({
  service,
  domain,
  site,
  header,
  footer,
}) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = language;
  const t = (obj) => resolveTranslated(obj, lang);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const name = resolveTranslated(service.name, lang);
  const description = resolveTranslated(service.description, lang);
  const shortDesc = resolveTranslated(service.short_description || service.description, lang);

  const packages = service.packages || [];
  const addons = service.addons || [];
  const gallery = service.gallery || [];
  const requirements = service.requirements || [];
  const serviceType = getServiceType(service);
  const badge = getServiceBadge(service);
  const route = getServiceRoute(service);
  const currency = service.currency || theme?.default_currency || "SAR";

  const basePrice = parseFloat(service.base_price || 0);
  const activePackage = selectedPackage || (packages.length > 0 ? packages[0] : null);
  const currentPrice = activePackage ? parseFloat(activePackage.price) : basePrice;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
  const totalPrice = currentPrice + addonsTotal;

  const deliveryDays = activePackage ? activePackage.delivery_days : service.default_delivery_days;
  const revisions = activePackage ? activePackage.revisions : service.default_revisions;

  const ctaUrl = useMemo(() => {
    const base = route.url;
    const params = new URLSearchParams();
    if (activePackage?.id) params.set("package", activePackage.id);
    selectedAddons.forEach((a) => params.append("addon", a.id));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [route.url, activePackage, selectedAddons]);

  const ctaLabel =
    route.flow === "booking"
      ? t({ en: "Book Now", ar: "احجز الآن", ur: "ابھی بک کریں" })
      : route.flow === "order"
      ? t({ en: "Order Now", ar: "اطلب الآن", ur: "ابھی آرڈر کریں" })
      : t({ en: "Get Started", ar: "ابدأ الآن", ur: "شروع کریں" });

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && (
        <LayoutRenderer sections={headerSection} language={lang} site={site} />
      )}

      <PortalBrandRoot site={site} as="main" dir={isRTL ? "rtl" : "ltr"} className={`min-h-screen bg-muted ${isRTL ? "rtl" : ""}`}>
        {/* ── Hero ── */}
        <div className="bg-card border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">
                {t({ en: "Home", ar: "الرئيسية", ur: "ہوم" })}
              </Link>
              <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              <span className="text-foreground truncate">{name}</span>
            </nav>

            <div className="flex flex-col lg:flex-row gap-8">
              {service.image && (
                <div className="lg:w-3/5">
                  <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={service.image} alt={name} className="w-full h-full object-cover" />
                    {badge && (
                      <span className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                        {badge.labelKey}
                      </span>
                    )}
                  </div>

                  {gallery.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {gallery.map((img, i) => (
                        <div key={i} className="w-20 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={`flex-1 min-w-0 ${service.image ? "" : "max-w-3xl"}`}>
                {service.category && (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {typeof service.category === "object"
                      ? resolveTranslated(service.category.name, lang)
                      : service.category.name || service.category}
                  </span>
                )}

                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2 leading-tight">{name}</h1>

                {shortDesc && <p className="text-base text-muted-foreground mt-3 leading-relaxed">{shortDesc}</p>}

                <div className="flex items-center gap-4 mt-5 flex-wrap">
                  {Number(service.average_rating) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-semibold text-foreground">{Number(service.average_rating).toFixed(1)}</span>
                      {service.total_reviews > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({service.total_reviews} {t({ en: "reviews", ar: "تقييم", ur: "جائزے" })})
                        </span>
                      )}
                    </div>
                  )}
                  {service.total_bookings > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {service.total_bookings} {t({ en: "orders completed", ar: "طلب مكتمل", ur: "مکمل آرڈرز" })}
                    </span>
                  )}
                </div>

                {/* Mobile: price + CTA */}
                <div className="lg:hidden mt-6 p-4 bg-muted rounded-xl border border-border">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalPrice, currency)}</span>
                    {packages.length > 0 && !selectedPackage && (
                      <span className="text-sm text-muted-foreground">{t({ en: "starting from", ar: "يبدأ من", ur: "شروع از" })}</span>
                    )}
                  </div>
                  <a href={ctaUrl} className="block w-full py-3.5 bg-primary text-primary-foreground text-center rounded-xl font-semibold hover:brightness-110 transition">
                    {ctaLabel}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 lg:pb-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0 space-y-6">
              {description && (
                <Section title={t({ en: "About this service", ar: "عن هذه الخدمة", ur: "اس سروس کے بارے میں" })}>
                  <div className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">{description}</div>
                </Section>
              )}

              {packages.length > 0 && (
                <Section title={t({ en: "Choose a package", ar: "اختر باقة", ur: "پیکج منتخب کریں" })}>
                  <PackageSelector
                    packages={packages}
                    selected={activePackage}
                    onSelect={setSelectedPackage}
                    currency={currency}
                    lang={lang}
                    isRTL={isRTL}
                    theme={theme}
                  />
                </Section>
              )}

              {addons.length > 0 && (
                <Section title={t({ en: "Enhance your order", ar: "حسّن طلبك", ur: "اپنا آرڈر بہتر بنائیں" })}>
                  <AddonSelector
                    addons={addons}
                    selected={selectedAddons}
                    onToggle={(addon) => {
                      setSelectedAddons((prev) => {
                        const exists = prev.find((a) => a.id === addon.id);
                        return exists ? prev.filter((a) => a.id !== addon.id) : [...prev, addon];
                      });
                    }}
                    currency={currency}
                    lang={lang}
                    isRTL={isRTL}
                    theme={theme}
                  />
                </Section>
              )}

              {requirements.length > 0 && (
                <Section title={t({ en: "What we'll need from you", ar: "ما نحتاجه منك", ur: "ہمیں آپ سے کیا چاہیے" })}>
                  <div className="space-y-3">
                    {requirements.map((req, i) => {
                      const reqName =
                        typeof req === "object"
                          ? resolveTranslated(req.name || req.label, lang) || req.name
                          : req;
                      return (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-foreground font-medium">{reqName}</span>
                            {req.required && <span className="text-danger ms-1 text-xs">*</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {serviceType === "online" && service.duration_minutes && (
                <Section title={t({ en: "Session details", ar: "تفاصيل الجلسة", ur: "سیشن کی تفصیلات" })}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t({ en: "Duration", ar: "المدة", ur: "مدت" })}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {service.duration_minutes} {t({ en: "minutes", ar: "دقيقة", ur: "منٹ" })}
                      </p>
                    </div>
                  </div>
                </Section>
              )}
            </div>

            {/* Sticky sidebar (desktop) */}
            <div className="hidden lg:block w-[360px] shrink-0">
              <ServiceSidebar
                price={totalPrice}
                basePrice={currentPrice}
                addonsTotal={addonsTotal}
                currency={currency}
                deliveryDays={deliveryDays}
                revisions={revisions}
                duration={service.duration_minutes}
                serviceType={serviceType}
                ctaUrl={ctaUrl}
                ctaLabel={ctaLabel}
                theme={theme}
                lang={lang}
                isRTL={isRTL}
                packageName={activePackage ? resolveTranslated(activePackage.name, lang) : null}
                selectedAddons={selectedAddons}
              />
            </div>
          </div>
        </div>

        {/* Mobile sticky CTA bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border p-4 z-40" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <span className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalPrice, currency)}</span>
            <a href={ctaUrl} className="flex-1 max-w-[220px] py-3 bg-primary text-primary-foreground text-center rounded-xl font-semibold hover:brightness-110 transition">
              {ctaLabel}
            </a>
          </div>
        </div>
      </PortalBrandRoot>

      {footerSection.length > 0 && (
        <LayoutRenderer sections={footerSection} language={lang} site={site} />
      )}
    </>
  );
}
