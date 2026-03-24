// src/components/services/ServiceSidebar.js
"use client";

/**
 * ServiceSidebar — Sticky sidebar for service detail page
 *
 * Shows:
 *   - Price breakdown (package + addons)
 *   - Delivery time
 *   - Revisions
 *   - Session duration (for booking services)
 *   - CTA button
 */

import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

export default function ServiceSidebar({
  price,
  basePrice,
  addonsTotal = 0,
  currency = "USD",
  deliveryDays,
  revisions,
  duration,
  serviceType,
  ctaUrl,
  ctaLabel,
  theme = {},
  lang = "en",
  isRTL = false,
  packageName,
  selectedAddons = [],
}) {
  const primaryColor = theme.primary_color || "#3B82F6";
  const isBooking = serviceType === "online" || serviceType === "booking";

  return (
    <div className="sticky top-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Price header */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{ color: primaryColor }}
            >
              {currency} {price.toFixed(2)}
            </span>
          </div>
          {packageName && (
            <p className="text-sm text-gray-400 mt-1">{packageName}</p>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Delivery / Duration */}
          {isBooking && duration ? (
            <DetailRow
              icon="⏱️"
              label={resolveTranslated(
                { en: "Session Duration", ar: "مدة الجلسة", ur: "سیشن کی مدت" },
                lang
              )}
              value={`${duration} ${resolveTranslated(
                { en: "minutes", ar: "دقيقة", ur: "منٹ" },
                lang
              )}`}
            />
          ) : deliveryDays ? (
            <DetailRow
              icon="🚀"
              label={resolveTranslated(
                { en: "Delivery Time", ar: "وقت التسليم", ur: "ڈیلیوری وقت" },
                lang
              )}
              value={`${deliveryDays} ${resolveTranslated(
                { en: "days", ar: "أيام", ur: "دن" },
                lang
              )}`}
            />
          ) : null}

          {/* Revisions */}
          {revisions != null && !isBooking && (
            <DetailRow
              icon="🔄"
              label={resolveTranslated(
                { en: "Revisions", ar: "المراجعات", ur: "ریویژنز" },
                lang
              )}
              value={
                revisions === -1
                  ? resolveTranslated(
                      { en: "Unlimited", ar: "غير محدود", ur: "لامحدود" },
                      lang
                    )
                  : String(revisions)
              }
            />
          )}

          {/* Addons breakdown */}
          {selectedAddons.length > 0 && (
            <div className="pt-3 border-t border-gray-50 space-y-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                {resolveTranslated(
                  { en: "Add-ons", ar: "إضافات", ur: "ایڈ آنز" },
                  lang
                )}
              </p>
              {selectedAddons.map((addon) => {
                const addonName = resolveTranslated(addon.name, lang);
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate">{addonName}</span>
                    <span className="text-gray-800 font-medium shrink-0 ml-2">
                      +${parseFloat(addon.price).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Price breakdown if addons selected */}
          {addonsTotal > 0 && (
            <div className="pt-3 border-t border-gray-50">
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {resolveTranslated(
                    { en: "Subtotal", ar: "المجموع", ur: "ذیلی کل" },
                    lang
                  )}
                </span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>
                  {resolveTranslated(
                    { en: "Add-ons", ar: "إضافات", ur: "ایڈ آنز" },
                    lang
                  )}
                </span>
                <span>+${addonsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t border-gray-100">
                <span>
                  {resolveTranslated(
                    { en: "Total", ar: "الإجمالي", ur: "کل" },
                    lang
                  )}
                </span>
                <span style={{ color: primaryColor }}>
                  ${price.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="p-6 pt-0">
          <a
            href={ctaUrl}
            className="block w-full py-3.5 text-white text-center rounded-xl font-semibold text-base hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaLabel}
          </a>

          <p className="text-center text-[11px] text-gray-400 mt-3">
            {resolveTranslated(
              {
                en: "Secure checkout powered by Stripe",
                ar: "دفع آمن عبر Stripe",
                ur: "Stripe کے ذریعے محفوظ چیک آؤٹ",
              },
              lang
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}