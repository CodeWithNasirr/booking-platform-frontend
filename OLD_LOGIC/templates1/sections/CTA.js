"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function CTA({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  const primaryCTA =
    content.cta || {
      text: content.button_label,
      url: content.button_url,
    };

  const {
    variant = "banner",
    title,
    subtitle,
    secondary_button,
    background = "primary",
  } = content;

  /* ---------------- THEME ---------------- */
  const sectionBgStyle = resolveBackground(
    typeof background === "object" ? background.value : background
  );

  const textStyle = resolveTextColor("default");
  const mutedText = resolveTextColor("muted");
  const inverseText = resolveTextColor("inverse");

  /* ======================================================
     BANNER VARIANT
  ====================================================== */
  if (variant === "banner") {
    return (
      <section
        className="px-6 md:px-12 py-20"
        style={{
          ...sectionBgStyle,
          color: "var(--text-color)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">

          {title && (
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {T(title)}
            </h2>
          )}

          {subtitle && (
            <p className="text-xl mb-8" style={mutedText}>
              {T(subtitle)}
            </p>
          )}

          <div className="flex flex-wrap gap-4 justify-center">

            {primaryCTA?.text && (
              <a
                href={primaryCTA.url || "#"}
                className="px-8 py-4 font-semibold text-lg shadow-xl transition"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-text-inverse)",
                  borderRadius: "var(--radius)",
                }}
              >
                {T(primaryCTA.text)}
              </a>
            )}

            {secondary_button && (
              <a
                href="#"
                className="px-8 py-4 font-semibold text-lg transition"
                style={{
                  background: "transparent",
                  border: "2px solid currentColor",
                  color: "var(--text-color)",
                  borderRadius: "var(--radius)",
                }}
              >
                {T(secondary_button)}
              </a>
            )}

          </div>
        </div>
      </section>
    );
  }

  return null;
}
