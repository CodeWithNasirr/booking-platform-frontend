// src/components/services/PackageSelector.js
"use client";

/**
 * PackageSelector — Package selection with feature comparison
 *
 * Fiverr-style tabs for Basic / Standard / Premium packages.
 * Highlights the "popular" package. Shows features, delivery, revisions.
 */

import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

export default function PackageSelector({
  packages = [],
  selected,
  onSelect,
  currency = "USD",
  lang = "en",
  isRTL = false,
  theme = {},
}) {
  if (packages.length === 0) return null;

  const primaryColor = theme.primary_color || "#3B82F6";

  return (
    <div className="space-y-4">
      {/* Package tabs (for 2-3 packages) */}
      {packages.length <= 4 && (
        <div className={`grid gap-4 ${
          packages.length === 1
            ? "grid-cols-1 max-w-md"
            : packages.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-3"
        }`}>
          {packages.map((pkg) => {
            const isSelected = selected?.id === pkg.id;
            const name = resolveTranslated(pkg.name, lang);
            const description = resolveTranslated(pkg.description, lang);
            const features = pkg.features || [];
            const price = parseFloat(pkg.price || 0);
            const comparePrice = pkg.compare_at_price
              ? parseFloat(pkg.compare_at_price)
              : null;

            return (
              <button
                key={pkg.id}
                onClick={() => onSelect(pkg)}
                className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "shadow-lg"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}05`,
                      }
                    : {}
                }
              >
                {/* Popular badge */}
                {pkg.is_popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold text-white rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {resolveTranslated(
                      { en: "Popular", ar: "شائع", ur: "مقبول" },
                      lang
                    )}
                  </span>
                )}

                {/* Name */}
                <h3 className="font-bold text-gray-900 text-base">{name}</h3>

                {/* Price */}
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: isSelected ? primaryColor : "#111827" }}
                  >
                    ${price.toFixed(2)}
                  </span>
                  {comparePrice && comparePrice > price && (
                    <span className="text-sm text-gray-400 line-through">
                      ${comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {description && (
                  <p className="text-sm text-gray-500 mt-2">{description}</p>
                )}

                {/* Delivery + revisions */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  {pkg.delivery_days && (
                    <span className="flex items-center gap-1">
                      🚀 {pkg.delivery_days}{" "}
                      {resolveTranslated(
                        { en: "days", ar: "أيام", ur: "دن" },
                        lang
                      )}
                    </span>
                  )}
                  {pkg.revisions != null && (
                    <span className="flex items-center gap-1">
                      🔄{" "}
                      {pkg.revisions === -1
                        ? resolveTranslated(
                            {
                              en: "Unlimited",
                              ar: "غير محدود",
                              ur: "لامحدود",
                            },
                            lang
                          )
                        : `${pkg.revisions} ${resolveTranslated(
                            {
                              en: "revisions",
                              ar: "مراجعات",
                              ur: "ریویژنز",
                            },
                            lang
                          )}`}
                    </span>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {features.map((feature, i) => {
                      const text =
                        typeof feature === "object"
                          ? resolveTranslated(feature, lang)
                          : feature;
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <span
                            className="mt-0.5 shrink-0"
                            style={{ color: primaryColor }}
                          >
                            ✓
                          </span>
                          <span>{text}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}