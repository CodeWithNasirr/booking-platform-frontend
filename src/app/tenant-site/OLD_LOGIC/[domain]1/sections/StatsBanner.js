"use client";

import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function StatsBanner({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    background = "gradient",
    stats = [],
    title,
    subtitle,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedStats = resolveTranslatedArray(stats, lang, ["label"]);

  // Background classes/styles
  let bgStyle = {};
  let bgClass = "";
  let textClass = "text-white";

  if (background === "gradient") {
    const primary = theme.primary_color || "#3B82F6";
    const secondary = theme.secondary_color || "#8B5CF6";
    bgStyle = {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
    };
  } else if (background === "solid") {
    bgStyle = { backgroundColor: theme.primary_color || "#1F2937" };
  } else if (background === "light") {
    bgClass = "bg-gray-100";
    textClass = "text-gray-900";
  }

  return (
    <section 
      className={`${bgClass} py-16 px-6 ${isRTL ? "rtl" : ""}`}
      style={bgStyle}
    >
      <div className="max-w-7xl mx-auto">
        {/* Optional Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className={`text-3xl font-bold mb-3 ${textClass}`}>
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className={`text-lg ${background === "light" ? "text-gray-600" : "text-white/80"}`}>
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {resolvedStats.map((stat, idx) => (
            <div key={stat.id || idx} className="flex flex-col items-center">
              <div className={`text-4xl md:text-5xl font-extrabold ${textClass}`}>
                {stat.number || stat.value}
              </div>
              <p className={`text-sm md:text-base mt-2 ${background === "light" ? "text-gray-600" : "opacity-90 " + textClass}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
