// src/components/services/ServiceCard.js
"use client";

/**
 * ServiceCard — Reusable service listing card
 *
 * Used by ServicesSection and any other listing context.
 * Handles routing via serviceTypeHelper.
 *
 * Props:
 *   service    - Service object (from API or static JSON)
 *   mode       - "database" | "static"
 *   lang       - Language code
 *   isRTL      - RTL flag
 *   theme      - Theme object with primary_color etc.
 *   showPrice  - Show price
 *   showBadge  - Show service type badge
 *   variant    - "card" | "horizontal" | "compact"
 */

import Link from "next/link";
import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";
import {
  getServiceRoute,
  getServiceBadge,
  getServiceCTA,
  isCustomQuoteService,
} from "@/lib/serviceTypeHelper";

import { tenantRoutes } from "@/lib/tenantRoutes";
import { formatCurrency } from "@/lib/currency";
export default function ServiceCard({
  service,
  mode = "database",
  lang = "en",
  isRTL = false,
  theme = {},
  showPrice = true,
  showBadge = true,
  showRating = true,
  variant = "card",
  bookButtonText,
  bookButtonUrl,
}) {

  const currency =  service.currency ||  theme?.default_currency ||  "SAR";
  const name =
    mode === "database"
      ? resolveTranslated(service.name, lang)
      : resolveTranslated(service.name || service.title, lang);

  const description =
    mode === "database"
      ? resolveTranslated(
          service.short_description || service.description,
          lang
        )
      : resolveTranslated(service.description, lang);

  const image = service.image || service.image_url;
  const slug = service.slug;
  const rawPrice = service.price ?? service.base_price;
  const price = rawPrice ? Number(rawPrice) : null;
  const packages = service.packages || [];
  const startingPrice =
    packages.length > 0
      ? Math.min(...packages.map((p) => Number(p.price)))
      : price;
  const duration = service.duration_minutes;
  const deliveryDays = service.default_delivery_days;
  const rating = Number(service.average_rating || 0);
  const reviews = service.total_reviews || 0;
  const primaryColor = theme.primary_color || "#3B82F6";
  


  // Routing
  let route;

  if (mode === "database") {
    // Subscription services
    if (["monthly", "yearly"].includes(service.billing_type)) {
      route = {
        url: tenantRoutes.serviceSubscribe(service.slug),
        flow: "subscription",
      };
    }
    // Custom quote services
    else if (isCustomQuoteService(service)) {
      route = {
        url: tenantRoutes.requestService(),
        flow: "quote",
      };
    }
    // Normal booking/order services
    else {
      route = getServiceRoute(service);
    }
  } else {
    route = {
      url: bookButtonUrl || `/services/${slug}`,
      flow: "booking",
    };
  }

  // CTA
  const ctaText =
    mode === "static" && bookButtonText
      ? bookButtonText
      : mode === "database"
      ? getServiceCTA(service, lang)
      : resolveTranslated(
          {
            en: "Book Now",
            ar: "احجز الآن",
            ur: "بک کریں",
          },
          lang
        );


  // Detail page link (always goes to detail, not directly to checkout)
  const detailUrl = `/services/${slug}/`;

  const badge = mode === "database" && showBadge ? getServiceBadge(service) : null;

  // ─── Horizontal variant ───
  if (variant === "horizontal") {
    return (
      <Link
        href={detailUrl}
        className="flex bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group"
      >
        {image && (
          <div className="w-48 h-36 shrink-0 overflow-hidden">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {badge && (
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge.color}`}>
                  {badge.labelKey}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 truncate">{name}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            {showPrice && startingPrice > 0 && (
              <span className="font-bold" style={{ color: primaryColor }}>
                {formatCurrency(startingPrice, currency)}
              </span>
            )}
            {showRating && rating > 0 && (
              <span className="text-sm text-gray-400">
                ★ {rating.toFixed(1)} ({reviews})
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ─── Compact variant ───
  if (variant === "compact") {
    return (
      <Link
        href={detailUrl}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
      >
        {image && (
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <img src={image} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{name}</h3>
          {showPrice && startingPrice > 0 && (
            <span className="text-sm font-bold" style={{ color: primaryColor }}>
              {formatCurrency(startingPrice, currency)}
            </span>
          )}
        </div>
      </Link>
    );
  }

  // ─── Default card variant ───
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all group flex flex-col">
      {/* Image */}
      {image && (
        <Link href={detailUrl} className="block relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {badge && (
              <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full backdrop-blur-sm ${badge.color}`}>
                {badge.labelKey}
              </span>
            )}
            {service.is_featured && (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700">
                ⭐ Featured
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <Link href={detailUrl} className="block flex-1">
          {/* Category */}
          {service.category && (
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
              {typeof service.category === "object"
                ? resolveTranslated(service.category.name, lang)
                : service.category.name || ""}
            </span>
          )}

          <h3 className="text-lg font-bold text-gray-900 mt-1 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {name}
          </h3>

          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
              {description}
            </p>
          )}
        </Link>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 text-sm text-gray-400 flex-wrap">
          {showRating && rating > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-amber-400">★</span>
              <span className="font-medium text-gray-600">{rating.toFixed(1)}</span>
              <span>({reviews})</span>
            </span>
          )}
          {duration > 0 && (
            <span className="flex items-center gap-1">
              ⏱ {duration}m
            </span>
          )}
          {deliveryDays > 0 && (
            <span className="flex items-center gap-1">
              🚀 {deliveryDays}d
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className={`flex items-center justify-between pt-4 border-t border-gray-50 ${isRTL ? "flex-row-reverse" : ""}`}>
          {showPrice && startingPrice > 0 && (
            <div>
              {packages.length > 0 && (
                <span className="text-[10px] text-gray-400 block">
                  {resolveTranslated(
                    { en: "Starting at", ar: "يبدأ من", ur: "شروع از" },
                    lang
                  )}
                </span>
              )}
              <span
                className="text-xl font-bold"
                style={{ color: primaryColor }}
              >
                {formatCurrency(startingPrice, currency)}
              </span>
            </div>
          )}

          <Link
            href={route.url}
            className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}