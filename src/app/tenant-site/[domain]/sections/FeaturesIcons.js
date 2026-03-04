"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function FeaturesIcons({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    title,
    subtitle,
    layout = "icons_4col",
    items = [],
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedItems = resolveTranslatedArray(items, lang, ["title", "description"]);

  const colClass = layout === "icons_4col"
    ? "md:grid-cols-4"
    : "md:grid-cols-3";

  // Icon resolver
  const resolveIcon = (icon) => {
    const iconMap = {
      video: "🎥",
      calendar: "📅",
      chart: "📊",
      file: "📄",
      check: "✓",
      star: "⭐",
      heart: "❤️",
      shield: "🛡️",
      clock: "🕐",
      users: "👥",
      phone: "📱",
      email: "✉️",
      location: "📍",
      globe: "🌐",
      settings: "⚙️",
      support: "💬",
    };
    return iconMap[icon] || icon || "✨";
  };

  return (
    <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className="text-gray-600 text-lg">{resolvedSubtitle}</p>
            )}
          </div>
        )}

        {/* Icon Grid */}
        <div className={`grid grid-cols-2 ${colClass} gap-12`}>
          {resolvedItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="text-center p-6 hover:scale-105 transition-transform"
            >
              <div 
                className="text-5xl mb-4"
                style={{ color: theme.primary_color || "#3B82F6" }}
              >
                {resolveIcon(item.icon)}
              </div>

              <h3 className="font-semibold text-xl text-gray-900 mb-2">
                {item.title}
              </h3>

              {item.description && (
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {resolvedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No features to display.</p>
          </div>
        )}
      </div>
    </section>
  );
}
