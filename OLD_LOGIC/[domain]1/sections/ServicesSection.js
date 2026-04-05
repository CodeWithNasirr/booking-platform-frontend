"use client";

import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function ServicesSection({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    variant = "grid",
    title,
    subtitle,
    services = [],
    columns = 3,
    show_price = true,
    show_duration = true,
    show_book_button = true,
    book_button_text,
    card_style = "elevated",
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedBookButton = resolveTranslated(book_button_text, lang) || "Book Now";
  const resolvedServices = resolveTranslatedArray(services, lang, ["name", "title", "description"]);

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

  // Button style using theme
  const buttonStyle = {
    backgroundColor: theme.primary_color || "#3B82F6",
  };

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

      {/* Services Grid */}
      <div className={`grid ${colsClass} gap-8 max-w-7xl mx-auto`}>
        {resolvedServices.map((service, idx) => (
          <div key={service.id || idx} className={cardClasses}>
            {/* Service Image */}
            {service.image && (
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <img
                  src={service.image}
                  alt={service.name || service.title}
                  className="w-full h-full object-cover"
                />
                {service.category && (
                  <span 
                    className="absolute top-4 left-4 px-3 py-1 text-white text-xs font-medium rounded-full"
                    style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                  >
                    {resolveTranslated(service.category, lang)}
                  </span>
                )}
              </div>
            )}

            {/* Service Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {service.name || service.title}
              </h3>

              {service.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              {/* Price & Duration */}
              <div className="flex items-center justify-between mb-4">
                {show_price && service.price !== undefined && (
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: theme.primary_color || "#3B82F6" }}
                  >
                    ${service.price}
                  </div>
                )}

                {show_duration && service.duration_minutes && (
                  <div className="text-sm text-gray-500">
                    {service.duration_minutes} min
                  </div>
                )}
              </div>

              {/* Book Button */}
              {show_book_button && (
                <a
                  href={`/book/${service.id || service.slug || idx}`}
                  className="block w-full py-3 text-white text-center rounded-xl font-semibold hover:opacity-90 transition-all"
                  style={buttonStyle}
                >
                  {resolvedBookButton}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {resolvedServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No services available at the moment.</p>
        </div>
      )}
    </section>
  );
}
