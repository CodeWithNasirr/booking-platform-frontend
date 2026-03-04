"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import {
  resolveTranslated,
  resolveTranslatedArray,
} from "../utils/resolveTranslated";

export default function ServicesSection({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = propLang || language;
  console.log(data,"XXXXXXXXXXXXXXXXXXXXXXX")
  const {
    layout = "cards", // 🔥 aligned with editor
    title,
    subtitle,
    services = [],
    columns = 3,
    show_price = true,
    show_duration = true,
    show_book_button = true,
    book_button_url = "#",
    book_button_text,
    card_style = "elevated",
  } = data || {};

  // -----------------------------
  // Resolve translations
  // -----------------------------
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedBookButton =
    resolveTranslated(book_button_text, lang) || "Book Now";

  const resolvedServices = resolveTranslatedArray(services, lang, [
    "name",
    "title",
    "description",
  ]);

  // -----------------------------
  // Layout / Columns
  // -----------------------------
  const colsClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns] || "md:grid-cols-3";

  const gridClass =
    layout === "list"
      ? "grid grid-cols-1 gap-6"
      : `grid grid-cols-1 ${colsClass} gap-8`;

  // -----------------------------
  // Card styles
  // -----------------------------
  const cardClasses = {
    elevated:
      "bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
    flat: "bg-gray-50 rounded-xl",
    bordered:
      "bg-white rounded-xl border-2 border-gray-200 hover:border-[color:var(--color-primary)] transition-colors",
  }[card_style];

  const buttonStyle = {
    backgroundColor: "var(--color-primary)",
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
      {/* Header */}
      {(resolvedTitle || resolvedSubtitle) && (
        <div className="max-w-3xl mx-auto text-center mb-12">
          {resolvedTitle && (
            <h2 className="text-4xl font-bold text-[color:var(--color-text)] mb-4">
              {resolvedTitle}
            </h2>
          )}
          {resolvedSubtitle && (
            <p className="text-xl text-[color:var(--color-text-muted)]">
              {resolvedSubtitle}
            </p>
          )}
        </div>
      )}

     {/* Services */}
    <div className={`${gridClass} max-w-7xl mx-auto`}>
      {resolvedServices.map((service, idx) => (
        <div
          key={service.id || idx}
          className={`${cardClasses} ${
            layout === "list" ? "flex gap-6 p-6 items-start" : ""
          }`}
        >
          {/* Emoji Icon (Grid / Cards) */}
          {service.icon && layout !== "list" && (
            <div className="flex items-center justify-center pt-6">
              <span className="text-5xl">{service.icon}</span>
            </div>
          )}

          {/* Content */}
          <div className={layout === "list" ? "flex-1" : "p-6"}>
            {/* Title Row (List layout shows emoji inline) */}
            <div className="flex items-center gap-3 mb-2">
              {service.icon && layout === "list" && (
                <span className="text-3xl">{service.icon}</span>
              )}

              <h3 className="text-xl font-bold text-[color:var(--color-text)]">
                {service.name || service.title}
              </h3>
            </div>

            {/* Description */}
            {service.description && (
              <p className="text-[color:var(--color-text-muted)] text-sm mb-4 line-clamp-2">
                {service.description}
              </p>
            )}

            {/* Price / Delivery */}
            <div className="flex items-center justify-between mb-4">
              {service.price && (
                <div
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {service.price}
                </div>
              )}

              {service.delivery && (
                <div className="text-sm text-gray-500">
                  {service.delivery}
                </div>
              )}
            </div>

            {/* CTA */}
            {show_book_button && (
              <a
                href={book_button_url}
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
          <p className="text-gray-500">
            No services available at the moment.
          </p>
        </div>
      )}
    </section>
  );
}
