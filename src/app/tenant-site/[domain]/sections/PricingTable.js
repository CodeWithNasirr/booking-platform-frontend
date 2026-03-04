"use client";

import { useState } from "react";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function PricingTable({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const lang = propLang || language;

  const {
    title,
    subtitle,
    plans = [],
    billing_toggle = false,
    highlight_recommended = false,
  } = data || {};

  const [isYearly, setIsYearly] = useState(false);

  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);

  const monthlyLabel = resolveTranslated(
    { en: "Monthly", ar: "شهري", ur: "ماہانہ" },
    lang
  );

  const yearlyLabel = resolveTranslated(
    { en: "Yearly", ar: "سنوي", ur: "سالانہ" },
    lang
  );

  return (
    <section
      className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* ================= Header ================= */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-10">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold mb-4 text-[color:var(--color-text)]">
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-[color:var(--color-text-muted)]">
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* ================= Billing Toggle ================= */}
        {billing_toggle && (
          <div
            className={`flex justify-center mb-14 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex items-center gap-2 rounded-full p-1 border border-[color:var(--color-border)]">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  !isYearly
                    ? "text-white"
                    : "text-[color:var(--color-text-muted)]"
                }`}
                style={{
                  backgroundColor: !isYearly
                    ? "var(--color-primary)"
                    : "transparent",
                }}
              >
                {monthlyLabel}
              </button>

              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  isYearly
                    ? "text-white"
                    : "text-[color:var(--color-text-muted)]"
                }`}
                style={{
                  backgroundColor: isYearly
                    ? "var(--color-primary)"
                    : "transparent",
                }}
              >
                {yearlyLabel}
              </button>
            </div>
          </div>
        )}

        {/* ================= Pricing Grid ================= */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, idx) => {
            const name = resolveTranslated(plan.name, lang);
            const period = isYearly
              ? resolveTranslated(plan.period_yearly, lang)
              : resolveTranslated(plan.period_monthly, lang);

            const ctaText = resolveTranslated(plan.cta, lang) || "Get Started";

            const price = isYearly
              ? plan.price_yearly
              : plan.price_monthly;

            const isFeatured =
              plan.highlighted ||
              (highlight_recommended && plan.recommended);

            const features = resolveTranslatedArray(plan.features || [], lang);

            return (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 transition-all ${
                  isFeatured ? "scale-105" : ""
                }`}
                style={{
                  backgroundColor: "var(--color-background)",
                  border: isFeatured
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                {/* Featured Badge */}
                {isFeatured && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-sm font-semibold rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Recommended
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold mb-3 text-[color:var(--color-text)]">
                  {name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-[color:var(--color-text)]">
                    {price}
                  </span>
                  {period && (
                    <span className="ml-2 text-[color:var(--color-text-muted)]">
                      /{period}
                    </span>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <ul className="space-y-3 mb-8">
                    {features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className={`flex items-center gap-3 ${
                          isRTL ? "flex-row-reverse" : ""
                        }`}
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: "var(--color-primary)" }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-[color:var(--color-text-muted)]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <button
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all"
                  style={
                    isFeatured
                      ? {
                          backgroundColor: "var(--color-primary)",
                          color: "#fff",
                        }
                      : {
                          border: "2px solid var(--color-primary)",
                          color: "var(--color-primary)",
                          backgroundColor: "transparent",
                        }
                  }
                >
                  {ctaText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
