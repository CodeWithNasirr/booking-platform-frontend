"use client";

import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function AboutSection({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    variant = "split",
    title,
    subtitle,
    content,
    image,
    highlights = [],
    cta_text,
    cta_link,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedContent = resolveTranslated(content, lang);
  const resolvedCtaText = resolveTranslated(cta_text, lang);
  const resolvedHighlights = resolveTranslatedArray(highlights, lang, ["title", "description"]);

  // ===================================================================
  // SPLIT VARIANT (Image + Text)
  // ===================================================================
  if (variant === "split") {
    return (
      <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`grid md:grid-cols-2 gap-12 items-center ${isRTL ? "md:flex-row-reverse" : ""}`}>
            {/* Image */}
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt={resolvedTitle || "About"}
                  className="rounded-2xl shadow-xl w-full object-cover"
                />
                {/* Decorative element */}
                <div 
                  className="absolute -bottom-4 -right-4 w-24 h-24 rounded-xl -z-10"
                  style={{ backgroundColor: theme.primary_color || "#3B82F6", opacity: 0.2 }}
                />
              </div>
            )}

            {/* Content */}
            <div>
              {resolvedSubtitle && (
                <p 
                  className="text-sm font-semibold uppercase tracking-wider mb-2"
                  style={{ color: theme.primary_color || "#3B82F6" }}
                >
                  {resolvedSubtitle}
                </p>
              )}
              
              {resolvedTitle && (
                <h2 className="text-4xl font-bold text-gray-900 mb-6">{resolvedTitle}</h2>
              )}
              
              {resolvedContent && (
                <div 
                  className="text-gray-600 leading-relaxed mb-6 prose"
                  dangerouslySetInnerHTML={{ __html: resolvedContent }}
                />
              )}

              {/* Highlights */}
              {resolvedHighlights.length > 0 && (
                <ul className="space-y-3 mb-8">
                  {resolvedHighlights.map((item, idx) => (
                    <li 
                      key={idx} 
                      className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}
                    >
                      <svg 
                        className="w-6 h-6 flex-shrink-0 mt-0.5"
                        style={{ color: theme.primary_color || "#10B981" }}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{item.title || item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              {resolvedCtaText && (
                <a
                  href={cta_link || "#"}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                >
                  {resolvedCtaText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // CENTERED VARIANT
  // ===================================================================
  if (variant === "centered") {
    return (
      <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-4xl mx-auto text-center">
          {resolvedSubtitle && (
            <p 
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: theme.primary_color || "#3B82F6" }}
            >
              {resolvedSubtitle}
            </p>
          )}
          
          {resolvedTitle && (
            <h2 className="text-4xl font-bold text-gray-900 mb-6">{resolvedTitle}</h2>
          )}

          {image && (
            <img
              src={image}
              alt={resolvedTitle || "About"}
              className="rounded-2xl shadow-xl w-full max-w-2xl mx-auto mb-8 object-cover"
            />
          )}
          
          {resolvedContent && (
            <div 
              className="text-gray-600 text-lg leading-relaxed mb-8 prose mx-auto"
              dangerouslySetInnerHTML={{ __html: resolvedContent }}
            />
          )}

          {resolvedCtaText && (
            <a
              href={cta_link || "#"}
              className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {resolvedCtaText}
            </a>
          )}
        </div>
      </section>
    );
  }

  return null;
}
