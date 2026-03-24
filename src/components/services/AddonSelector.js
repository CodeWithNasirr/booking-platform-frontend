// src/components/services/AddonSelector.js
"use client";

/**
 * AddonSelector — Toggle-style addon selection
 *
 * Each addon shows name, description, price, and additional days.
 * Click to toggle on/off.
 */

import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

export default function AddonSelector({
  addons = [],
  selected = [],
  onToggle,
  currency = "USD",
  lang = "en",
  isRTL = false,
  theme = {},
}) {
  if (addons.length === 0) return null;

  const primaryColor = theme.primary_color || "#3B82F6";

  return (
    <div className="space-y-3">
      {addons
        .filter((a) => a.is_active !== false)
        .map((addon) => {
          const isSelected = selected.some((s) => s.id === addon.id);
          const name = resolveTranslated(addon.name, lang);
          const description = resolveTranslated(addon.description, lang);
          const price = parseFloat(addon.price || 0);

          return (
            <button
              key={addon.id}
              onClick={() => onToggle(addon)}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "shadow-sm"
                  : "border-gray-100 hover:border-gray-200"
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
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  isSelected ? "border-transparent" : "border-gray-300"
                }`}
                style={
                  isSelected ? { backgroundColor: primaryColor } : {}
                }
              >
                {isSelected && (
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
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {name}
                  </span>
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{ color: primaryColor }}
                  >
                    +${price.toFixed(2)}
                  </span>
                </div>
                {description && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {description}
                  </p>
                )}
                {addon.additional_days > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    +{addon.additional_days}{" "}
                    {resolveTranslated(
                      {
                        en: "extra days",
                        ar: "أيام إضافية",
                        ur: "اضافی دن",
                      },
                      lang
                    )}
                  </p>
                )}
              </div>
            </button>
          );
        })}
    </div>
  );
}