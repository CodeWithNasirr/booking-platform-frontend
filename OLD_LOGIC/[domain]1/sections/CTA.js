"use client";

import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated } from "../utils/resolveTranslated";

export default function CTA({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    variant = "banner",
    style = "gradient",
    title,
    subtitle,
    button_label,
    button_url = "#",
    secondary_button,
    secondary_button_url = "#",
    background_color,
    text_color = "white",
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedButtonLabel = resolveTranslated(button_label, lang);
  const resolvedSecondaryButton = resolveTranslated(secondary_button, lang);

  const textColorClass = text_color === "white" ? "text-white" : "text-gray-900";
  const subtitleColorClass = text_color === "white" ? "text-white/90" : "text-gray-600";

  // Background handling
  let bgStyle = {};
  let bgClass = "";

  if (style === "gradient") {
    const primary = theme.primary_color || "#3B82F6";
    const secondary = theme.secondary_color || "#8B5CF6";
    bgStyle = {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
    };
  } else if (style === "solid_color") {
    bgStyle = { 
      backgroundColor: background_color || theme.primary_color || "#3B82F6" 
    };
  } else if (style === "bordered") {
    bgClass = "bg-white border-2 border-gray-200";
  }

  // Button styles
  const primaryButtonStyle = text_color === "white"
    ? { backgroundColor: "white", color: theme.primary_color || "#3B82F6" }
    : { backgroundColor: theme.primary_color || "#3B82F6", color: "white" };

  // ===================================================================
  // BANNER VARIANT
  // ===================================================================
  if (variant === "banner" || variant === "cta_banner") {
    return (
      <section
        className={`px-6 md:px-12 py-20 ${bgClass} ${isRTL ? "rtl" : ""}`}
        style={bgStyle}
      >
        <div className="max-w-4xl mx-auto text-center">
          {resolvedTitle && (
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textColorClass}`}>
              {resolvedTitle}
            </h2>
          )}

          {resolvedSubtitle && (
            <p className={`text-xl mb-8 ${subtitleColorClass}`}>
              {resolvedSubtitle}
            </p>
          )}

          <div className={`flex flex-wrap gap-4 justify-center ${isRTL ? "flex-row-reverse" : ""}`}>
            {resolvedButtonLabel && (
              <a
                href={button_url}
                className="px-8 py-4 rounded-xl font-semibold text-lg shadow-xl transition-all hover:opacity-90"
                style={primaryButtonStyle}
              >
                {resolvedButtonLabel}
              </a>
            )}

            {resolvedSecondaryButton && (
              <a
                href={secondary_button_url}
                className={`px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-colors ${
                  text_color === "white"
                    ? "border-white text-white hover:bg-white/10"
                    : "border-gray-900 text-gray-900 hover:bg-gray-100"
                }`}
              >
                {resolvedSecondaryButton}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // SPLIT VARIANT
  // ===================================================================
  if (variant === "split") {
    return (
      <section className={`px-6 md:px-12 py-20 bg-gray-50 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            {resolvedTitle && (
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-gray-600 mb-6">{resolvedSubtitle}</p>
            )}
            {resolvedButtonLabel && (
              <a
                href={button_url}
                className="inline-block px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
              >
                {resolvedButtonLabel}
              </a>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-gray-500 text-center">
              {/* Placeholder for booking widget or calendar */}
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <span className="text-gray-400">Booking Calendar</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // MINIMAL VARIANT
  // ===================================================================
  if (variant === "minimal") {
    return (
      <section className={`px-6 md:px-12 py-12 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-gray-50 rounded-2xl">
          <div>
            {resolvedTitle && (
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {resolvedTitle}
              </h3>
            )}
            {resolvedSubtitle && (
              <p className="text-gray-600">{resolvedSubtitle}</p>
            )}
          </div>

          {resolvedButtonLabel && (
            <a
              href={button_url}
              className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all whitespace-nowrap"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {resolvedButtonLabel}
            </a>
          )}
        </div>
      </section>
    );
  }

  return null;
}
