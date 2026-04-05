"use client";

import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Steps({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    variant = "horizontal",
    title,
    subtitle,
    steps = [],
    show_icons = true,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedSteps = resolveTranslatedArray(steps, lang, ["title", "description"]);

  // ===================================================================
  // HORIZONTAL VARIANT
  // ===================================================================
  if (variant === "horizontal") {
    return (
      <section className={`px-6 md:px-12 py-20 bg-gray-50 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          {(resolvedTitle || resolvedSubtitle) && (
            <div className="text-center mb-16">
              {resolvedTitle && (
                <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
              )}
              {resolvedSubtitle && (
                <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
              )}
            </div>
          )}

          {/* Steps */}
          <div className={`grid md:grid-cols-${Math.min(resolvedSteps.length, 4)} gap-8 relative`}>
            {resolvedSteps.map((step, idx) => (
              <div key={step.id || idx} className="relative">
                {/* Connector line */}
                {idx < resolvedSteps.length - 1 && (
                  <div 
                    className={`hidden md:block absolute top-12 ${isRTL ? "right-[60%]" : "left-[60%]"} w-[80%] h-0.5 bg-gray-300`}
                  />
                )}

                <div className="relative z-10 text-center">
                  <div 
                    className="w-24 h-24 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg"
                    style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                  >
                    {step.number || step.icon || idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                  {step.duration && (
                    <span className="inline-block mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                      {step.duration}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // VERTICAL VARIANT
  // ===================================================================
  if (variant === "vertical") {
    return (
      <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          {(resolvedTitle || resolvedSubtitle) && (
            <div className="mb-12">
              {resolvedTitle && (
                <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
              )}
              {resolvedSubtitle && (
                <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
              )}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-8">
            {resolvedSteps.map((step, idx) => (
              <div key={step.id || idx} className={`flex gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="flex-shrink-0">
                  <div 
                    className="w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold"
                    style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                  >
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                  {step.activities && (
                    <ul className="mt-3 space-y-1">
                      {resolveTranslatedArray(step.activities, lang).map((activity, i) => (
                        <li key={i} className={`text-sm text-gray-500 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span 
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                          />
                          {typeof activity === "string" ? activity : activity.text || activity.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // TIMELINE VARIANT
  // ===================================================================
  if (variant === "timeline") {
    return (
      <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          {(resolvedTitle || resolvedSubtitle) && (
            <div className="text-center mb-12">
              {resolvedTitle && (
                <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
              )}
              {resolvedSubtitle && (
                <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="relative">
            {/* Center line */}
            <div 
              className={`absolute ${isRTL ? "right-1/2" : "left-1/2"} transform -translate-x-1/2 h-full w-0.5`}
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            />

            {resolvedSteps.map((step, idx) => (
              <div 
                key={step.id || idx} 
                className={`relative flex items-center mb-8 ${
                  idx % 2 === 0 
                    ? (isRTL ? "flex-row" : "flex-row-reverse") 
                    : (isRTL ? "flex-row-reverse" : "flex-row")
                }`}
              >
                {/* Content */}
                <div className="w-5/12 p-6 bg-white rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>

                {/* Center dot */}
                <div className="w-2/12 flex justify-center">
                  <div 
                    className="w-4 h-4 rounded-full border-4 bg-white"
                    style={{ borderColor: theme.primary_color || "#3B82F6" }}
                  />
                </div>

                {/* Spacer */}
                <div className="w-5/12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
