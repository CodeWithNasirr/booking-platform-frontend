"use client";

/**
 * ServicesSection.js - UPDATED
 * 
 * Now uses centralized serviceTypeHelper for:
 * - Service type detection
 * - CTA routing (booking vs milestone vs order)
 * - Badge rendering
 * 
 * Modes:
 * - mode="static" (default): Uses JSON content from website builder
 * - mode="database": Fetches real services from API
 */

import { useState, useEffect } from "react";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";
import Link from "next/link";
import { tenantRoutes } from "@/lib/tenantRoutes";

// ─── Centralized service type logic ─────────────────────────────────────────
import {
  getServiceType,
  getServiceRoute,
  getServiceBadge,
  getServiceCTA,
  isBookableService,
  isMilestoneService,
  isProjectService,
  isSubscriptionService,
  isCustomQuoteService,
} from "@/lib/serviceTypeHelper";


export default function ServicesSection({ data, lang: propLang, domain }) {

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = propLang || language;
  
  const {
    variant = "grid",
    title,
    subtitle,
    services = [],
    mode = "static",
    service_ids = [],
    category_filter = null,
    service_type_filter = null,
    featured_only = false,
    max_services = 6,
    columns = 3,
    show_price = true,
    show_duration = true,
    show_book_button = true,
    show_service_type_badge = true,
    book_button_url,
    book_button_text,
    card_style = "elevated",
    show_custom_request_cta = false,
    custom_request_cta_text,
    custom_request_cta_url,
  } = data || {};

  // State for database mode
  const [dbServices, setDbServices] = useState([]);
  const [loading, setLoading] = useState(mode === "database");
  const [error, setError] = useState(null);

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedBookButton = resolveTranslated(book_button_text, lang) || "Book Now";

  // Fetch services from database if in database mode
  useEffect(() => {
    if (mode !== "database") return;

    const fetchServices = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        if (service_ids.length > 0) {
          params.append("ids", service_ids.join(","));
        }
        if (category_filter) {
          params.append("category", category_filter);
        }
        if (service_type_filter) {
          params.append("order_type", service_type_filter);
        }
        if (featured_only) {
          params.append("featured", "true");
        }
        params.append("limit", String(max_services));
        params.append("is_active", "true");

        const response = await fetch(
          `${API_BASE}/api/v1/public-services/`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Tenant": domain,
            },
            credentials: 'include',
          }
        );

        if (!response.ok) throw new Error("Failed to fetch services");
        
        const data = await response.json();
        setDbServices(data.results || data);
        setError(null);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [mode, service_ids, category_filter, service_type_filter, featured_only, max_services, domain]);

  // Determine which services to display
  const displayServices = mode === "database" 
    ? dbServices 
    : resolveTranslatedArray(services, lang, ["name", "title", "description"]);


  const colsClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns] || "md:grid-cols-3";

  const cardClasses = {
    elevated: "bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
    flat: "bg-gray-50 rounded-xl",
    bordered: "bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-colors",
  }[card_style];

  const buttonStyle = {
    backgroundColor: theme.primary_color || "#3B82F6",
  };

  // Loading state
  if (loading) {
    return (
      <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
      {/* Header */}
      {(resolvedTitle || resolvedSubtitle) && (
        <div className="max-w-3xl mx-auto text-center mb-12">
          {resolvedTitle && (
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {resolvedTitle}
            </h2>
          )}
          {resolvedSubtitle && (
            <p className="text-xl text-gray-600">
              {resolvedSubtitle}
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-red-500">
          <p>Failed to load services. Please try again.</p>
        </div>
      )}

      {/* Services Grid */}
      <div className={`grid ${colsClass} gap-8 max-w-7xl mx-auto`}>
        {displayServices.map((service, idx) => (
          <ServiceCard
            key={service.id || idx}
            service={service}
            mode={mode}
            domain={domain}
            cardClasses={cardClasses}
            buttonStyle={buttonStyle}
            showPrice={show_price}
            showDuration={show_duration}
            showBookButton={show_book_button}
            showServiceTypeBadge={show_service_type_badge}
            bookButtonText={resolvedBookButton}
            bookButtonUrl={book_button_url}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* Empty State */}
      {displayServices.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No services available at the moment.</p>
        </div>
      )}

      {/* Custom Request CTA */}
      {mode === "database" && show_custom_request_cta && displayServices.length > 0 && (
        <div className="max-w-3xl mx-auto mt-16">
          <div
            className="rounded-2xl p-8 text-center border-2 border-dashed"
            style={{ borderColor: `${theme.primary_color || "#3B82F6"}40` }}
          >
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {resolveTranslated(custom_request_cta_text, lang) ||
                resolveTranslated({
                  en: "Can't find what you're looking for?",
                  ar: "لا تجد ما تبحث عنه؟",
                  ur: "آپ جو ڈھونڈ رہے ہیں وہ نہیں مل رہا؟",
                }, lang)}
            </h3>
            <p className="text-gray-600 mb-6">
              {resolveTranslated({
                en: "Tell us what you need and we'll create a custom quote just for you.",
                ar: "أخبرنا بما تحتاجه وسنقدم لك عرض سعر مخصص.",
                ur: "ہمیں بتائیں آپ کو کیا چاہیے اور ہم آپ کے لیے ایک حسب ضرورت کوٹ بنائیں گے۔",
              }, lang)}
            </p>
            <Link
              href={custom_request_cta_url || tenantRoutes.requestService()}
              className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              style={buttonStyle}
            >
              {resolveTranslated({
                en: "Request Custom Service",
                ar: "طلب خدمة مخصصة",
                ur: "حسب ضرورت خدمت کی درخواست کریں",
              }, lang)}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M19 12H5M12 5l-7 7 7 7" : "M5 12h14M12 5l7 7-7 7"} />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// SERVICE CARD COMPONENT
// ============================================================

function ServiceCard({
  service,
  mode,
  domain,
  cardClasses,
  buttonStyle,
  showPrice,
  showDuration,
  showBookButton,
  showServiceTypeBadge,
  bookButtonText,
  bookButtonUrl,
  theme,
  lang,
  isRTL,
}) {
  const name = mode === "database"
    ? resolveTranslated(service.name, lang)
    : resolveTranslated(service.name || service.title, lang);

  const description = mode === "database"
    ? resolveTranslated(service.short_description || service.description, lang)
    : resolveTranslated(service.description, lang);

  // ── Use centralized helper for type detection ──
  const serviceType = mode === "database" ? getServiceType(service) : null;

  const rawPrice = service.price ?? service.base_price;
  const price = rawPrice ? Number(rawPrice) : null;

  const duration = service.duration_minutes;
  const image = service.image || service.image_url;
  const category = service.category;
  const slug = service.slug;
  
  const packages = service.packages || [];
  const hasPackages = packages.length > 0;
  const startingPrice = hasPackages 
    ? Math.min(...packages.map(p => p.price))
    : price;

  // ── Use centralized routing helper ──
  const getCtaInfo = () => {
    if (mode === "static") {
      return {
        text: bookButtonText,
        url: bookButtonUrl || "#",
      };
    }

    if (isCustomQuoteService(service)) {
      return {
        text: getServiceCTA(service, lang),
        url: tenantRoutes.requestService(),
      };
    }

    const route = getServiceRoute(service);
    return {
      text: getServiceCTA(service, lang),
      url: route.url,
    };
  };

  const cta = getCtaInfo();
  const subscription = mode === "database" && isSubscriptionService(service);

  // ── Use centralized badge helper ──
  const getTypeBadge = () => {
    if (!showServiceTypeBadge || mode === "static" || !serviceType) return null;

    const badge = getServiceBadge(service);
    if (!badge) return null;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.labelKey}
      </span>
    );
  };

  return (
    <div className={cardClasses}>
      {/* Service Image */}
      {image && (
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          {/* Category Badge */}
          {category && (
            <span 
              className="absolute top-4 left-4 px-3 py-1 text-white text-xs font-medium rounded-full"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {typeof category === "object" ? resolveTranslated(category.name, lang) : category.name}
            </span>
          )}
          {/* Service Type Badge */}
          {getTypeBadge() && (
            <div className="absolute top-4 right-4">
              {getTypeBadge()}
            </div>
          )}
        </div>
      )}

      {/* Service Content */}
      <div className="p-6">
        <div className={`flex items-start justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {name}
          </h3>
          {!image && getTypeBadge()}
        </div>

        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Milestone Service: Show package info */}
        {mode === "database" && isMilestoneService(service) && hasPackages && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">
              {resolveTranslated({ en: "Starting from", ar: "يبدأ من", ur: "شروع از" }, lang)}
            </p>
            <p className="text-lg font-bold" style={{ color: theme.primary_color }}>
              ${startingPrice}
            </p>
            <p className="text-xs text-gray-500">
              {packages.length} {resolveTranslated({ 
                en: "packages available", 
                ar: "باقات متاحة", 
                ur: "پیکجز دستیاب" 
              }, lang)}
            </p>
          </div>
        )}

        {/* Subscription Badge */}
        {subscription && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {service.billing_type === "yearly"
                ? resolveTranslated({ en: "Yearly Plan", ar: "خطة سنوية", ur: "سالانہ پلان" }, lang)
                : resolveTranslated({ en: "Monthly Plan", ar: "خطة شهرية", ur: "ماہانہ پلان" }, lang)}
            </span>
          </div>
        )}

        {/* Price & Duration (for booking/static) */}
        {(mode === "database" || (mode === "static" && (price || duration))) && (
        <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            {showPrice && typeof price === "number" && price > 0 && (
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: theme.primary_color || "#3B82F6" }}
              >
                {service.currency || "SAR"} {price}
              </span>
              {subscription && (
                <span className="text-sm text-gray-500">
                  /{service.billing_type === "yearly"
                    ? resolveTranslated({ en: "yr", ar: "سنة", ur: "سال" }, lang)
                    : resolveTranslated({ en: "mo", ar: "شهر", ur: "مہینہ" }, lang)}
                </span>
              )}
            </div>
            )}

            {showDuration && typeof duration === "number" && duration > 0 && (
            <div className="text-sm text-gray-500">
                {duration} min
            </div>
            )}
          </div>
        )}

        {/* Milestone Service: Show delivery time */}
        {mode === "database" && isProjectService(service) && service.estimated_delivery_days && (
          <div className={`flex items-center gap-2 mb-4 text-sm text-gray-500 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span>🚀</span>
            <span>
              {resolveTranslated({ en: "Delivery:", ar: "التسليم:", ur: "ڈیلیوری:" }, lang)}{" "}
              {service.estimated_delivery_days} {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
            </span>
          </div>
        )}

        {/* Rating (for database mode) */}
        {mode === "database" && Number(service.average_rating) > 0 && (
      <div className={`flex items-center gap-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">⭐</span>
          <span className="font-medium">
            {Number(service.average_rating).toFixed(1)}
          </span>
        </div>

        {service.total_reviews > 0 && (
          <span className="text-sm text-gray-500">
            ({service.total_reviews} {resolveTranslated({
              en: "reviews",
              ar: "تقييمات",
              ur: "جائزے"
            }, lang)})
          </span>
        )}
      </div>
    )}

        {/* CTA Button */}
        {showBookButton &&
        (mode === "database" || (mode === "static" && bookButtonUrl)) && (
            <Link
            href={cta.url}
            className="block w-full py-3 text-white text-center rounded-xl font-semibold hover:opacity-90 transition-all"
            style={buttonStyle}
            >
            {cta.text}
            </Link>
        )}

      </div>
    </div>
  );
}