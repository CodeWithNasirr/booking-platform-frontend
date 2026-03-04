"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function Steps({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  const {
    variant = "horizontal", // horizontal | vertical | numbered | timeline
    title,
    subtitle,
    steps = [],
    background = "soft",
  } = content;

  /* ---------------- THEME ---------------- */
  const bgStyle = resolveBackground(
    typeof background === "object" ? background.value : background
  );

  const textStyle = resolveTextColor("default");
  const mutedText = resolveTextColor("muted");

  /* ======================================================
     HORIZONTAL STEPS
  ====================================================== */
  if (variant === "horizontal") {
    return (
      <section
        className="px-6 md:px-12 py-20"
        style={{
          ...bgStyle,
          color: "var(--text-color)",
        }}
      >
        <div className="max-w-6xl mx-auto">

          {(title || subtitle) && (
            <div className="text-center mb-16">
              {title && (
                <h2 className="text-4xl font-bold mb-4">
                  {T(title)}
                </h2>
              )}
              {subtitle && (
                <p className="text-xl" style={mutedText}>
                  {T(subtitle)}
                </p>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">

                {/* Connector */}
                {idx < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px"
                    style={{ background: "var(--color-border, #e5e7eb)" }}
                  />
                )}

                <div className="relative z-10 text-center">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg"
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-text-inverse)",
                    }}
                  >
                    {step.number || idx + 1}
                  </div>

                  <h3 className="text-xl font-semibold mb-3">
                    {T(step.title)}
                  </h3>

                  <p style={mutedText}>
                    {T(step.description)}
                  </p>

                  {step.duration && (
                    <span
                      className="inline-block mt-3 px-3 py-1 rounded-full text-sm"
                      style={{
                        background: "var(--color-background-soft)",
                        ...mutedText,
                      }}
                    >
                      {T(step.duration)}
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

  /* ======================================================
     VERTICAL STEPS
  ====================================================== */
  if (variant === "vertical") {
    return (
      <section
        className="px-6 md:px-12 py-20"
        style={{
          ...bgStyle,
          color: "var(--text-color)",
        }}
      >
        <div className="max-w-3xl mx-auto">

          {(title || subtitle) && (
            <div className="mb-12">
              {title && (
                <h2 className="text-4xl font-bold mb-4">
                  {T(title)}
                </h2>
              )}
              {subtitle && (
                <p className="text-xl" style={mutedText}>
                  {T(subtitle)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6">

                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-text-inverse)",
                    }}
                  >
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {T(step.title)}
                  </h3>

                  <p style={mutedText}>
                    {T(step.description)}
                  </p>

                  {step.activities && (
                    <ul className="mt-3 space-y-2">
                      {step.activities.map((activity, i) => (
                        <li
                          key={i}
                          className="text-sm flex items-center gap-2"
                          style={mutedText}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "var(--color-primary)" }}
                          />
                          {T(activity)}
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

  return null;
}
