"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import {
  resolveTranslated,
  resolveTranslatedArray,
} from "../utils/resolveTranslated";

export default function StatsBanner({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = propLang || language;

  const {
    background = {},
    stats = [],
    title,
    subtitle,
  } = data || {};

  // -----------------------------
  // Resolve translations
  // -----------------------------
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedStats = resolveTranslatedArray(stats, lang, ["label"]);

  // -----------------------------
  // Background handling
  // -----------------------------
  const backgroundType = background.type || "gradient";
  const backgroundValue = background.value || null;

  let bgStyle = {};
  let textClass = "text-white";
  let mutedTextClass = "text-white/80";

  if (backgroundType === "gradient") {
    bgStyle = {
      background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
    };
  }

  if (backgroundType === "solid") {
    bgStyle = {
      backgroundColor: backgroundValue || "var(--color-primary)",
    };
  }

  if (backgroundType === "image" && backgroundValue) {
    bgStyle = {
      backgroundImage: `url(${backgroundValue})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  if (backgroundType === "light") {
    bgStyle = {
      backgroundColor: "var(--color-background)",
    };
    textClass = "text-[color:var(--color-text)]";
    mutedTextClass = "text-[color:var(--color-text-muted)]";
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <section
      className={`relative py-16 px-6 ${isRTL ? "rtl" : ""}`}
      style={bgStyle}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className={`text-3xl font-bold mb-3 ${textClass}`}>
                {resolvedTitle}
              </h2>
            )}

            {resolvedSubtitle && (
              <p className={`text-lg ${mutedTextClass}`}>
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {resolvedStats.map((stat, idx) => (
            <div
              key={stat.id || idx}
              className="flex flex-col items-center"
            >
              <div className={`text-4xl md:text-5xl font-extrabold ${textClass}`}>
                {stat.number || stat.value}
              </div>

              <p
                className={`text-sm md:text-base mt-2 ${
                  backgroundType === "light"
                    ? "text-gray-600"
                    : "opacity-90 " + textClass
                }`}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
