"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated } from "../utils/resolveTranslated";
import { resolveNavItem } from "@/lib/navigationResolver";

/* ============================================================
   CTA COMPONENT
   ============================================================ */

export default function CTA({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const lang = propLang || language;

  const {
    variant = "banner",
    title,
    subtitle,
    button_label,
    button_url = "#",
    button_destination = null,
    secondary_button,
    secondary_button_url = "#",
    secondary_button_destination = null,
    text_color = "white",
    background = { type: "gradient", value: null },
  } = data || {};

  const primaryNav = resolveNavItem({ destination: button_destination, url: button_url });
  const secondaryNav = resolveNavItem({ destination: secondary_button_destination, url: secondary_button_url });

  /* ================= Translations ================= */
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedButtonLabel = resolveTranslated(button_label, lang);
  const resolvedSecondaryButton = resolveTranslated(secondary_button, lang);

  /* ================= Text Color Map ================= */
  const textColorClassMap = {
    white: "text-white",
    black: "text-black",
    primary: "text-[color:var(--color-primary)]",
    secondary: "text-[color:var(--color-secondary)]",
  };

  const text_colors =
    textColorClassMap[text_color] || "text-[color:var(--color-text)]";

  const subtitleClass =
    text_color === "white"
      ? "text-white/90"
      : "text-[color:var(--color-text-muted)]";

  /* ================= Background Logic ================= */
  let bgStyle = {};

  if (background?.type === "solid") {
    bgStyle = {
      backgroundColor: background.value || "var(--color-primary)",
    };
  }

  if (background?.type === "gradient") {
    bgStyle = {
      background:
        "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
    };
  }

  if (background?.type === "image" && background.value) {
    bgStyle = {
      backgroundImage: `url(${background.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  /* ================= Button Style ================= */
  const primaryButtonStyle =
    text_color === "white"
      ? { backgroundColor: "#fff", color: "var(--color-primary)" }
      : { backgroundColor: "var(--color-primary)", color: "#fff" };

  /* ============================================================
     BANNER VARIANT
     ============================================================ */
  if (variant === "banner" || variant === "cta_banner") {
    return (
      <section
        className={`relative px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}
        style={bgStyle}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {resolvedTitle && (
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${text_colors}`}>
              {resolvedTitle}
            </h2>
          )}

          {resolvedSubtitle && (
            <p className={`text-xl mb-8 ${subtitleClass}`}>
              {resolvedSubtitle}
            </p>
          )}

          <div
            className={`flex flex-wrap gap-4 justify-center ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            {resolvedButtonLabel && (
              <a
                href={primaryNav.href}
                target={primaryNav.target}
                rel={primaryNav.rel}
                className="px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:opacity-90 transition-all"
                style={primaryButtonStyle}
              >
                {resolvedButtonLabel}
              </a>
            )}

            {resolvedSecondaryButton && (
              <a
                href={secondaryNav.href}
                target={secondaryNav.target}
                rel={secondaryNav.rel}
                className={`px-8 py-4 rounded-xl font-semibold text-lg border transition-all ${
                  text_color === "white"
                    ? "border-white text-white hover:bg-white/10"
                    : "border-[color:var(--color-primary)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)/10]"
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

  /* ============================================================
     SPLIT VARIANT
     ============================================================ */
  if (variant === "split") {
    return (
      <section
        className={`relative px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}
        style={bgStyle}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            {resolvedTitle && (
              <h2 className={`text-4xl font-bold mb-4 ${text_colors}`}>
                {resolvedTitle}
              </h2>
            )}

            {resolvedSubtitle && (
              <p className={`text-xl mb-6 ${subtitleClass}`}>
                {resolvedSubtitle}
              </p>
            )}

            {resolvedButtonLabel && (
              <a
                href={primaryNav.href}
                target={primaryNav.target}
                rel={primaryNav.rel}
                className="inline-block px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {resolvedButtonLabel}
              </a>
            )}
          </div>

          <div className="bg-[color:var(--color-background)] rounded-2xl shadow-xl p-8">
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-[color:var(--color-border)] rounded-xl">
              <span className="text-[color:var(--color-text-muted)]">
                Booking / Form Area
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
     MINIMAL VARIANT
     ============================================================ */
  if (variant === "minimal") {
    return (
      <section className={`px-6 md:px-12 py-12 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)]">
          <div>
            {resolvedTitle && (
              <h3 className="text-2xl font-bold text-[color:var(--color-text)] mb-2">
                {resolvedTitle}
              </h3>
            )}

            {resolvedSubtitle && (
              <p className="text-[color:var(--color-text-muted)]">
                {resolvedSubtitle}
              </p>
            )}
          </div>

          {resolvedButtonLabel && (
            <a
              href={primaryNav.href}
              target={primaryNav.target}
              rel={primaryNav.rel}
              className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all whitespace-nowrap"
              style={{ backgroundColor: "var(--color-primary)" }}
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
