"use client";

import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

export default function ServiceCard({
  service,
  isSelected,
  onSelect,
  showPrice = true,
  showDuration = true,
  showImage = true,
  theme,
  lang,
  isRTL,
}) {
  const title = resolveTranslated(service.title || service.name, lang);
  const description = resolveTranslated(service.short_description, lang);
  const price = resolveTranslated(service.base_price || service.price_label, lang);

  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className={`flex gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        {showImage && service.image && (
          <img
            src={service.image}
            alt={title}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        )}

        <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>

          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
              {description}
            </p>
          )}

          <div className={`flex items-center gap-3 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
            {showPrice && price && (
              <span
                className="font-semibold"
                style={{ color: theme.primary_color || "#3B82F6" }}
              >
                {price}
              </span>
            )}

            {showDuration && service.duration_minutes && (
              <span className="text-gray-400">
                {service.duration_minutes} min
              </span>
            )}
          </div>
        </div>

        <div className={`flex-shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`}>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            ✓
          </div>
        </div>
      </div>
    </button>
  );
}
