"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import {
  resolveTranslated,
  resolveTranslatedArray,
} from "../utils/resolveTranslated";

export default function Grid({ data = {}, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const lang = propLang || language;

  const {
    title,
    subtitle,
    items = [],
    variant = "cards",
    columns = 3,
    gap = "normal",
    card_style = "elevated",
    show_cta = false,
    cta_text,
  } = data;

  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedItems = resolveTranslatedArray(items, lang, [
    "title",
    "description",
    "subtitle",
    "text",
  ]);
  const resolvedCtaText =
    resolveTranslated(cta_text, lang) || "Learn More";

  const gapClass = {
    tight: "gap-4",
    normal: "gap-6",
    wide: "gap-8",
  }[gap];

  const colsClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  }[columns] || "md:grid-cols-3";

  return (
    <section
      className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}
    >
      {/* Header */}
      {(resolvedTitle || resolvedSubtitle) && (
        <div className="max-w-3xl mx-auto text-center mb-14">
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

      {/* Grid */}
      <div
        className={`grid grid-cols-1 ${colsClass} ${gapClass} max-w-7xl mx-auto`}
      >
        {resolvedItems.map((item, index) => (
          <GridItem
            key={item.id || index}
            item={item}
            variant={variant}
            cardStyle={card_style}
            showCTA={show_cta}
            ctaText={resolvedCtaText}
            theme={theme}
          />
        ))}
      </div>

      {/* Empty state */}
      {resolvedItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No items to display.
        </div>
      )}
    </section>
  );
}

// ============================================================
// GRID ITEM
// ============================================================

function GridItem({
  item,
  variant,
  cardStyle,
  showCTA,
  ctaText,
  theme,
}) {
  const cardClasses = {
    elevated:
      "bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
    flat: "bg-gray-50 rounded-xl",
    bordered:
      "bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition-colors",
  }[cardStyle];

  // ---------------- ICONS ----------------
  if (variant === "icons") {
    return (
      <div className="flex flex-col items-center text-center p-6 hover:scale-105 transition-transform">
        <div
          className="text-5xl mb-4"
          style={{ color: theme.primary_color }}
        >
          {item.icon || "✨"}
        </div>
        {item.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {item.title}
          </h3>
        )}
        {item.description && (
          <p className="text-sm text-gray-600">
            {item.description}
          </p>
        )}
      </div>
    );
  }

  // ---------------- MINIMAL ----------------
  if (variant === "minimal") {
    return (
      <div className="text-center p-6">
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
        )}
        {item.title && (
          <h3 className="font-semibold text-gray-900">
            {item.title}
          </h3>
        )}
        {item.subtitle && (
          <p className="text-sm text-gray-500">
            {item.subtitle}
          </p>
        )}
      </div>
    );
  }

  // ---------------- CARDS (DEFAULT) ----------------
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
        {item.title && (
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {item.title}
          </h3>
        )}

        {item.description && (
          <p className="text-sm text-gray-600 mb-4">
            {item.description}
          </p>
        )}

        {item.price !== undefined && (
          <div
            className="text-lg font-semibold mb-4"
            style={{ color: theme.primary_color }}
          >
            ${item.price}
          </div>
        )}

        {showCTA && item.url && (
          <a
            href={item.url}
            className="inline-block px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primary_color }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
