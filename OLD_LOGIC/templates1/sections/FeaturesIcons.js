"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function FeaturesIcons({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  const {
    title,
    subtitle,
    layout = "icons_4col",
    text_color = "default",
    features = [],
  } = content;

  /* ---------------- TEXT COLORS ---------------- */
  const titleStyle = resolveTextColor(
    text_color === "white" ? "inverse" : "default"
  );

  const subtitleStyle = resolveTextColor(
    text_color === "white" ? "inverse" : "muted"
  );

  const cardText = resolveTextColor("default");
  const cardMuted = resolveTextColor("muted");

  const colClass =
    layout === "icons_4col"
      ? "md:grid-cols-4"
      : "md:grid-cols-3";

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {title && (
              <h2
                className="text-4xl font-bold mb-3"
                style={titleStyle}
              >
                {T(title)}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-lg"
                style={subtitleStyle}
              >
                {T(subtitle)}
              </p>
            )}
          </div>
        )}

        {/* Icon Grid */}
        <div className={`grid grid-cols-2 ${colClass} gap-12`}>
          {features.map((item, idx) => (
            <div
              key={idx}
              className="text-center p-6 rounded-2xl hover:scale-105 transition-transform"
              style={{
                background: "var(--color-background)",
              }}
            >
              <div
                className="text-5xl mb-4"
                style={{ color: "var(--color-primary)" }}
              >
                {resolveIcon(item.icon)}
              </div>

              <h3
                className="font-semibold text-xl mb-2"
                style={cardText}
              >
                {T(item.title)}
              </h3>

              <p
                className="text-sm"
                style={cardMuted}
              >
                {T(item.description)}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ---------------- ICON RESOLVER ---------------- */
function resolveIcon(icon) {
  const map = {
    stethoscope: "🩺",
    globe: "🌍",
    "file-check": "📄✔️",
    chat: "💬",
    video: "🎥",
    calendar: "📅",
    chart: "📊",
    file: "📄",
  };
  return map[icon] || "✨";
}
