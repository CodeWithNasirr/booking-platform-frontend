"use client";

import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function PricingTable({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    title,
    subtitle,
    plans = [],
    billing_toggle = false,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedPlans = resolveTranslatedArray(plans, lang, ["name", "description", "price", "period", "cta_text"]);

  return (
    <section className={`py-20 px-6 bg-gray-50 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-7xl mx-auto">
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

        {/* Pricing Cards */}
        <div className={`grid md:grid-cols-${Math.min(resolvedPlans.length, 3)} gap-8 max-w-5xl mx-auto`}>
          {resolvedPlans.map((plan, idx) => (
            <div
              key={plan.id || idx}
              className={`bg-white rounded-2xl p-8 shadow-lg relative ${
                plan.featured ? "ring-2 scale-105" : ""
              }`}
              style={plan.featured ? { ringColor: theme.primary_color || "#3B82F6" } : {}}
            >
              {/* Featured Badge */}
              {plan.featured && (
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-sm font-semibold rounded-full"
                  style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                >
                  {plan.badge || "Most Popular"}
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              
              {plan.description && (
                <p className="text-gray-600 mb-6">{plan.description}</p>
              )}

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">
                  {plan.currency || "$"}{plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-500 ml-2">/{plan.period}</span>
                )}
              </div>

              {/* Features */}
              {plan.features && (
                <ul className="space-y-3 mb-8">
                  {resolveTranslatedArray(plan.features, lang).map((feature, fIdx) => (
                    <li 
                      key={fIdx} 
                      className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <svg 
                        className="w-5 h-5 flex-shrink-0" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        style={{ color: theme.primary_color || "#10B981" }}
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">
                        {typeof feature === "string" ? feature : feature.text || feature.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA Button */}
              <button
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  plan.featured
                    ? "text-white hover:opacity-90"
                    : "border-2 hover:bg-gray-50"
                }`}
                style={
                  plan.featured
                    ? { backgroundColor: theme.primary_color || "#3B82F6" }
                    : { borderColor: theme.primary_color || "#3B82F6", color: theme.primary_color || "#3B82F6" }
                }
              >
                {plan.cta_text || "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
