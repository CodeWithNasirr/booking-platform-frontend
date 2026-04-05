"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";

export default function Grid({ data, isEditor = false }) {
  const { lang } = useTenantLang();

  /** Normalize template JSON (support data or data.content) */
  const content = data?.content || data || {};

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
  } = content;

  /** Translation helper */
  const T = (v) => resolveTranslated(v, lang);

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
    <section className="px-6 md:px-12 py-20">
      {/* Header */}
      {(title || subtitle) && (
        <div className="max-w-3xl mx-auto text-center mb-12">
          {title && (
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {T(title)}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl text-gray-600">{T(subtitle)}</p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className={`grid ${colsClass} ${gapClass}`}>
        {items.map((item, idx) => (
          <GridItem
            key={idx}
            item={item}
            variant={variant}
            cardStyle={card_style}
            showCTA={show_cta}
            ctaText={cta_text}
            T={T}
          />
        ))}
      </div>
    </section>
  );
}

function GridItem({ item, variant, cardStyle, showCTA, ctaText, T }) {
  const cardClasses = {
    elevated: "bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow",
    flat: "bg-gray-50 rounded-xl",
    bordered: "bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-colors",
  }[cardStyle];

  // ================= ICONS VARIANT ==================
  if (variant === "icons") {
    return (
      <div className="flex flex-col items-center text-center hover:scale-105 transition-transform">
        <div className="text-5xl mb-3">{item.icon}</div>
        <p className="text-gray-700 font-semibold text-lg">
          {T(item.title)}
        </p>
      </div>
    );
  }

  // ================= CARDS VARIANT ==================
  if (variant === "cards") {
    return (
      <div className={`${cardClasses} overflow-hidden border border-gray-100`}>
        {item.image && (
          <img
            src={item.image}
            alt={T(item.title)}
            className="w-full h-56 object-cover"
          />
        )}

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {T(item.title)}
          </h3>

          {item.description && (
            <p className="text-gray-600 text-sm mb-4">
              {T(item.description)}
            </p>
          )}

          {item.price && (
            <div className="text-blue-600 font-semibold text-xl mb-4">
              {T(item.price)}
            </div>
          )}

          {showCTA && ctaText && (
            <button className="px-4 py-2 mt-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              {T(ctaText)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ================= MINIMAL VARIANT ==================
  if (variant === "minimal") {
    return (
      <div className="text-center">
        {item.image && (
          <img
            src={item.image}
            alt={T(item.title)}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
        )}
        {item.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {T(item.title)}
          </h3>
        )}
        {item.subtitle && (
          <p className="text-sm text-gray-500">{T(item.subtitle)}</p>
        )}
      </div>
    );
  }

  return null;
}
