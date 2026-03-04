"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function StatsBanner({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  const {
    background = "gradient",
    stats = [],
  } = content;

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
      className="py-16 px-6"
      style={{
        ...bgStyle,
        color: "var(--text-color)",
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center"
          >
            {/* NUMBER */}
            <div
              className="text-4xl md:text-5xl font-extrabold"
              style={{ color: "var(--color-primary)" }}
            >
              {T(stat.number)}
            </div>

            {/* LABEL */}
            <p
              className="text-sm md:text-base mt-2"
              style={{
                ...mutedText,
                color: "var(--text-color)",
              }}
            >
              {T(stat.label)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
