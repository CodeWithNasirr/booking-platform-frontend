// src/app/tenant-site/[domain]/services/[slug]/ServiceDetailClient.js
"use client";

/**
 * ServiceDetailClient — Service Detail Page
 *
 * Fiverr/Calendly-style layout:
 *   LEFT (65%)  — Hero, description, packages, features, reviews
 *   RIGHT (35%) — Sticky sidebar with price, delivery info, CTA
 *
 * Routes to:
 *   order_type="booking" → /booking/service/{slug}
 *   order_type="order"   → /services/{slug}/order
 */

import { useState, useMemo } from "react";

import { useTenantLang } from "@/app/tenant-site/contexts/TenantLangContext";

import { useTenantTheme } from "@/app/tenant-site/contexts/TenantThemeContext";

import resolveTranslated from "../../utils/resolveTranslated";
import {
  getServiceRoute,
  getServiceType,
  getServiceBadge,
} from "@/lib/serviceTypeHelper";

import LayoutRenderer from "../../LayoutRenderer";
import PackageSelector from "@/components/services/PackageSelector";
import AddonSelector from "@/components/services/AddonSelector";
import ServiceSidebar from "@/components/services/ServiceSidebar";

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

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Resolve multilingual fields
  const name = resolveTranslated(service.name, lang);
  const description = resolveTranslated(service.description, lang);
  const shortDesc = resolveTranslated(
    service.short_description || service.description,
    lang
  );

  const packages = service.packages || [];
  const addons = service.addons || [];
  const gallery = service.gallery || [];
  const requirements = service.requirements || [];
  const serviceType = getServiceType(service);
  const badge = getServiceBadge(service);
  const route = getServiceRoute(service);

  // Pricing
  const basePrice = parseFloat(service.base_price || 0);
  const activePackage = selectedPackage || (packages.length > 0 ? packages[0] : null);
  const currentPrice = activePackage
    ? parseFloat(activePackage.price)
    : basePrice;
  const addonsTotal = selectedAddons.reduce(
    (sum, a) => sum + parseFloat(a.price || 0),
    0
  );
  const totalPrice = currentPrice + addonsTotal;

  // Delivery days
  const deliveryDays = activePackage
    ? activePackage.delivery_days
    : service.default_delivery_days;
  const revisions = activePackage
    ? activePackage.revisions
    : service.default_revisions;

  // Build CTA URL with package/addon params
  const ctaUrl = useMemo(() => {
    const base = route.url;
    const params = new URLSearchParams();
    if (activePackage?.id) params.set("package", activePackage.id);
    selectedAddons.forEach((a) => params.append("addon", a.id));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [route.url, activePackage, selectedAddons]);


    console.log("Route:", route);
    console.log("CTA URL:", ctaUrl);

  const ctaLabel =
    route.flow === "booking"
      ? resolveTranslated(
          { en: "Book Now", ar: "احجز الآن", ur: "ابھی بک کریں" },
          lang
        )
      : route.flow === "order"
      ? resolveTranslated(
          { en: "Order Now", ar: "اطلب الآن", ur: "ابھی آرڈر کریں" },
          lang
        )
      : resolveTranslated(
          { en: "Get Started", ar: "ابدأ الآن", ur: "شروع کریں" },
          lang
        );

  // Header/footer as sections for LayoutRenderer
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {/* Render header */}
      {headerSection.length > 0 && (
        <LayoutRenderer
          sections={headerSection}
          language={lang}
          site={site}
        />
      )}

      <main
        className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : ""}`}
      >
        {/* ── Hero ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <a href="/" className="hover:text-gray-600 transition-colors">
                {resolveTranslated(
                  { en: "Home", ar: "الرئيسية", ur: "ہوم" },
                  lang
                )}
              </a>
              <span>/</span>
              <span className="text-gray-600">{name}</span>
            </nav>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Hero image */}
              {service.image && (
                <div className="lg:w-3/5">
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
                    <img
                      src={service.image}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                    {badge && (
                      <span
                        className={`absolute top-4 ${
                          isRTL ? "right-4" : "left-4"
                        } px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}
                      >
                        {badge.labelKey}
                      </span>
                    )}
                  </div>

                  {/* Gallery thumbnails */}
                  {gallery.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {gallery.map((img, i) => (
                        <div
                          key={i}
                          className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hero text */}
              <div className={`flex-1 ${service.image ? "" : "max-w-3xl"}`}>
                {service.category && (
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {typeof service.category === "object"
                      ? resolveTranslated(service.category.name, lang)
                      : service.category.name || service.category}
                  </span>
                )}

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 leading-tight">
                  {name}
                </h1>

                {shortDesc && (
                  <p className="text-lg text-gray-500 mt-3 leading-relaxed">
                    {shortDesc}
                  </p>
                )}

                {/* Rating + stats */}
                <div className="flex items-center gap-4 mt-5 flex-wrap">
                  {Number(service.average_rating) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-lg">★</span>
                      <span className="font-semibold text-gray-800">
                        {Number(service.average_rating).toFixed(1)}
                      </span>
                      {service.total_reviews > 0 && (
                        <span className="text-sm text-gray-400">
                          ({service.total_reviews}{" "}
                          {resolveTranslated(
                            {
                              en: "reviews",
                              ar: "تقييم",
                              ur: "جائزے",
                            },
                            lang
                          )}
                          )
                        </span>
                      )}
                    </div>
                  )}

                  {service.total_bookings > 0 && (
                    <span className="text-sm text-gray-400">
                      {service.total_bookings}{" "}
                      {resolveTranslated(
                        {
                          en: "orders completed",
                          ar: "طلب مكتمل",
                          ur: "مکمل آرڈرز",
                        },
                        lang
                      )}
                    </span>
                  )}
                </div>

                {/* Mobile: price + CTA */}
                <div className="lg:hidden mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: theme.primary_color || "#3B82F6" }}
                    >
                      {service.currency || "USD"} {totalPrice.toFixed(2)}
                    </span>
                    {packages.length > 0 && !selectedPackage && (
                      <span className="text-sm text-gray-400">
                        {resolveTranslated(
                          {
                            en: "starting from",
                            ar: "يبدأ من",
                            ur: "شروع از",
                          },
                          lang
                        )}
                      </span>
                    )}
                  </div>
                  <a
                    href={ctaUrl}
                    className="block w-full py-3.5 text-white text-center rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: theme.primary_color || "#3B82F6",
                    }}
                  >
                    {ctaLabel}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content area: 2-column ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ═══ LEFT COLUMN ═══ */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Description */}
              {description && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {resolveTranslated(
                      {
                        en: "About This Service",
                        ar: "عن هذه الخدمة",
                        ur: "اس سروس کے بارے میں",
                      },
                      lang
                    )}
                  </h2>
                  <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                    {description}
                  </div>
                </section>
              )}

              {/* Packages */}
              {packages.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">
                    {resolveTranslated(
                      {
                        en: "Choose a Package",
                        ar: "اختر باقة",
                        ur: "پیکج منتخب کریں",
                      },
                      lang
                    )}
                  </h2>
                  <PackageSelector
                    packages={packages}
                    selected={activePackage}
                    onSelect={setSelectedPackage}
                    currency={service.currency || "USD"}
                    lang={lang}
                    isRTL={isRTL}
                    theme={theme}
                  />
                </section>
              )}

              {/* Add-ons */}
              {addons.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">
                    {resolveTranslated(
                      {
                        en: "Enhance Your Order",
                        ar: "حسّن طلبك",
                        ur: "اپنا آرڈر بہتر بنائیں",
                      },
                      lang
                    )}
                  </h2>
                  <AddonSelector
                    addons={addons}
                    selected={selectedAddons}
                    onToggle={(addon) => {
                      setSelectedAddons((prev) => {
                        const exists = prev.find((a) => a.id === addon.id);
                        return exists
                          ? prev.filter((a) => a.id !== addon.id)
                          : [...prev, addon];
                      });
                    }}
                    currency={service.currency || "USD"}
                    lang={lang}
                    isRTL={isRTL}
                    theme={theme}
                  />
                </section>
              )}

              {/* Requirements preview */}
              {requirements.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {resolveTranslated(
                      {
                        en: "What We'll Need From You",
                        ar: "ما نحتاجه منك",
                        ur: "ہمیں آپ سے کیا چاہیے",
                      },
                      lang
                    )}
                  </h2>
                  <div className="space-y-3">
                    {requirements.map((req, i) => {
                      const reqName =
                        typeof req === "object"
                          ? resolveTranslated(req.name || req.label, lang) ||
                            req.name
                          : req;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-gray-700 font-medium">
                              {reqName}
                            </span>
                            {req.required && (
                              <span className="text-red-400 ml-1 text-xs">
                                *
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Duration / availability note for booking services */}
              {serviceType === "online" && service.duration_minutes && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {resolveTranslated(
                      {
                        en: "Session Details",
                        ar: "تفاصيل الجلسة",
                        ur: "سیشن کی تفصیلات",
                      },
                      lang
                    )}
                  </h2>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                        ⏱️
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          {resolveTranslated(
                            {
                              en: "Duration",
                              ar: "المدة",
                              ur: "مدت",
                            },
                            lang
                          )}
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {service.duration_minutes}{" "}
                          {resolveTranslated(
                            {
                              en: "minutes",
                              ar: "دقيقة",
                              ur: "منٹ",
                            },
                            lang
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* ═══ RIGHT COLUMN — Sticky Sidebar ═══ */}
            <div className="hidden lg:block w-[360px] shrink-0">
              <ServiceSidebar
                price={totalPrice}
                basePrice={currentPrice}
                addonsTotal={addonsTotal}
                currency={service.currency || "USD"}
                deliveryDays={deliveryDays}
                revisions={revisions}
                duration={service.duration_minutes}
                serviceType={serviceType}
                ctaUrl={ctaUrl}
                ctaLabel={ctaLabel}
                theme={theme}
                lang={lang}
                isRTL={isRTL}
                packageName={
                  activePackage
                    ? resolveTranslated(activePackage.name, lang)
                    : null
                }
                selectedAddons={selectedAddons}
              />
            </div>
          </div>
        </div>

        {/* Mobile sticky CTA bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <span
                className="text-xl font-bold"
                style={{ color: theme.primary_color || "#3B82F6" }}
              >
                {service.currency || "USD"} {totalPrice.toFixed(2)}
              </span>
            </div>
            <a
              href={ctaUrl}
              className="flex-1 max-w-[200px] py-3 text-white text-center rounded-xl font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {ctaLabel}
            </a>
          </div>
        </div>

        {/* Bottom padding for mobile sticky bar */}
        <div className="lg:hidden h-20" />
      </main>

      {/* Render footer */}
      {footerSection.length > 0 && (
        <LayoutRenderer
          sections={footerSection}
          language={lang}
          site={site}
        />
      )}
    </>
  );
}