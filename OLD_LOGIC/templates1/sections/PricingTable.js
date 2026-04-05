"use client";

import { useState } from "react";
import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function PricingTable({ data }) {
  const { lang } = useTenantLang();
  const content = data?.content || data || {};
  const T = (v) => resolveTranslated(v, lang);

  const {
    title,
    subtitle,
    billing_toggle = false,
    highlight_recommended = true,
    plans = [],
    background = "background",
  } = content;

  const [billing, setBilling] = useState("monthly");

  /* ---------------- THEME ---------------- */
  const bgStyle = resolveBackground(
    typeof background === "object" ? background.value : background
  );

  const textStyle = resolveTextColor(
    background === "dark" ? "inverse" : "default"
  );

  const mutedText = resolveTextColor("muted");

  return (
    <section
      className="py-20 px-6"
      style={{
        ...bgStyle,
        color: "var(--text-color)",
      }}
    >
      <div className="max-w-7xl mx-auto text-center">

        {/* HEADER */}
        {title && (
          <h2 className="text-4xl font-bold mb-4">
            {T(title)}
          </h2>
        )}

        {subtitle && (
          <p
            className="text-lg mb-12"
            style={{
              ...mutedText,
              color: "var(--text-color)",
            }}
          >
            {T(subtitle)}
          </p>
        )}

        {/* BILLING TOGGLE */}
        {billing_toggle && (
          <div className="mb-14 flex justify-center">
            <div
              className="p-1 rounded-full flex items-center"
              style={{ background: "var(--color-background-soft)" }}
            >
              {["monthly", "yearly"].map((type) => (
                <button
                  key={type}
                  onClick={() => setBilling(type)}
                  className="px-5 py-2 rounded-full text-sm font-medium transition"
                  style={{
                    background:
                      billing === type
                        ? "var(--color-background)"
                        : "transparent",
                    boxShadow:
                      billing === type
                        ? "0 2px 8px rgba(0,0,0,0.08)"
                        : "none",
                  }}
                >
                  {type === "monthly"
                    ? lang === "ar"
                      ? "شهري"
                      : lang === "ur"
                      ? "ماہانہ"
                      : "Monthly"
                    : lang === "ar"
                    ? "سنوي"
                    : lang === "ur"
                    ? "سالانہ"
                    : "Yearly"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PRICING GRID */}
        <div className="grid md:grid-cols-3 gap-10">
          {plans.map((plan, idx) => {
            const price =
              billing === "monthly"
                ? plan.price_monthly || plan.price
                : plan.price_yearly || plan.price;

            return (
              <div
                key={idx}
                className="rounded-2xl p-8 transition hover:-translate-y-1"
                style={{
                  background: "var(--color-background)",
                  border:
                    plan.highlighted && highlight_recommended
                      ? "2px solid var(--color-primary)"
                      : "1px solid var(--color-border, #e5e7eb)",
                  boxShadow:
                    plan.highlighted && highlight_recommended
                      ? "0 20px 40px rgba(0,0,0,0.08)"
                      : "0 6px 16px rgba(0,0,0,0.05)",
                }}
              >
                {/* NAME */}
                <h3 className="text-2xl font-bold mb-2">
                  {T(plan.name)}
                </h3>

                {/* PRICE */}
                <div
                  className="text-4xl font-extrabold mb-2"
                  style={{ color: "var(--color-primary)" }}
                >
                  {price}
                </div>

                {plan.period && (
                  <div
                    className="text-sm mb-6"
                    style={{
                      ...mutedText,
                      color: "var(--text-color)",
                    }}
                  >
                    {T(plan.period)}
                  </div>
                )}

                {/* FEATURES */}
                <ul className="space-y-3 text-left mb-8">
                  {plan.features?.map((f, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-center gap-2"
                      style={{ color: "var(--color-text)" }}
                    >
                      ✓ {T(f)}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.cta && (
                  <button
                    className="w-full px-5 py-3 font-semibold transition"
                    style={{
                      background: "var(--color-primary)",
                      color: "white",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    {T(plan.cta)}
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
