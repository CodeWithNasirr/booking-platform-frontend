"use client";

import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Grid({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    variant = "cards",
    columns = 3,
    gap = "normal",
    title,
    subtitle,
    items = [],
    show_cta = true,
    cta_text,
    card_style = "elevated",
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedCtaText = resolveTranslated(cta_text, lang) || "Learn More";
  const resolvedItems = resolveTranslatedArray(items, lang, ["title", "description", "subtitle", "text"]);

  const gapClass = {
    tight: "gap-4",
    normal: "gap-6",
    wide: "gap-8",
  }[gap];

  const colsClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    6: "md:grid-cols-6",
  }[columns];

  return (
    <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
      {/* Header */}
      {(resolvedTitle || resolvedSubtitle) && (
        <div className="max-w-3xl mx-auto text-center mb-12">
          {resolvedTitle && (
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
          )}
          {resolvedSubtitle && (
            <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className={`grid ${colsClass} ${gapClass} max-w-7xl mx-auto`}>
        {resolvedItems.map((item, idx) => (
          <GridItem
            key={item.id || idx}
            item={item}
            variant={variant}
            cardStyle={card_style}
            showCTA={show_cta}
            ctaText={resolvedCtaText}
            theme={theme}
            lang={lang}
          />
        ))}
      </div>

      {/* Empty State */}
      {resolvedItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items to display.</p>
        </div>
      )}
    </section>
  );
}

function GridItem({ item, variant, cardStyle, showCTA, ctaText, theme, lang }) {
  const cardClasses = {
    elevated: "bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
    flat: "bg-gray-50 rounded-xl",
    bordered: "bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-colors",
  }[cardStyle];

  // ================= ICONS VARIANT ==================
  if (variant === "icons") {
    return (
      <div className="flex flex-col items-center text-center hover:scale-105 transition-transform p-6">
        <div 
          className="text-5xl mb-4"
          style={{ color: theme.primary_color || "#3B82F6" }}
        >
          {item.icon || "✨"}
        </div>
        <h3 className="text-gray-900 font-semibold text-lg mb-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-gray-600 text-sm">
            {item.description}
          </p>
        )}
      </div>
    );
  }

  // ================= CARDS VARIANT ==================
  if (variant === "cards") {
    return (
      <div className={`${cardClasses} overflow-hidden`}>
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-56 object-cover"
          />
        )}

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-gray-600 text-sm mb-4">
              {item.description}
            </p>
          )}

          {item.price !== undefined && (
            <div 
              className="text-xl font-semibold mb-4"
              style={{ color: theme.primary_color || "#3B82F6" }}
            >
              ${item.price}
            </div>
          )}

          {showCTA && item.url && (
            <a
              href={item.url}
              className="inline-block px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  // ================= MINIMAL VARIANT ==================
  if (variant === "minimal") {
    return (
      <div className="text-center p-4">
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
        )}
        {item.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
        )}
        {item.subtitle && (
          <p className="text-sm text-gray-500">{item.subtitle}</p>
        )}
      </div>
    );
  }

  // ================= DEFAULT (CARDS) ==================
  return (
    <div className={`${cardClasses} p-6`}>
      {item.icon && (
        <div 
          className="text-4xl mb-4"
          style={{ color: theme.primary_color || "#3B82F6" }}
        >
          {item.icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {item.title}
      </h3>
      {item.description && (
        <p className="text-gray-600 text-sm">
          {item.description}
        </p>
      )}
    </div>
  );
}
