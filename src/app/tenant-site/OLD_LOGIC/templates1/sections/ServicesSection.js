"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function ServicesSection({ data, isEditor = false }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  const {
    title,
    subtitle,
    columns = 3,
    layout = "cards",
    services = [],
    show_cta = false,
    cta_button = null,
    background = "soft", // ✅ DEFAULT
  } = content;

  /* ---------------- BACKGROUND ---------------- */
  const sectionBgStyle = resolveBackground(
    typeof background === "object" ? background.value : background
  );

  const colClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns] || "md:grid-cols-3";

  return (
    <section
      className="py-20 px-6 md:px-12"
      style={sectionBgStyle}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-14">
            {title && (
              <h2  style={resolveTextColor("default")} className="text-4xl font-bold mb-4">
                {T(title)}
              </h2>
            )}
            {subtitle && (
              <p  style={resolveTextColor("default")} className="text-lg opacity-80">
                {T(subtitle)}
              </p>
            )}
          </div>
        )}

        {/* Services Grid */}
        <div className={`grid grid-cols-1 ${colClass} gap-10`}>
          {services.map((srv, idx) => (
            <ServiceCard
              key={idx}
              service={srv}
              layout={layout}
              lang={lang}
            />
          ))}
        </div>

        {/* CTA Button */}
        {show_cta && cta_button && (
          <div className="text-center mt-14">
            <a
              href={cta_button.url || "#"}
              className="px-8 py-4 font-semibold transition"
              style={{
                background: "var(--color-primary)",
                color: "white",
                borderRadius: "var(--radius)",
              }}
            >
              {T(cta_button.text)}
            </a>
          </div>
        )}

      </div>
    </section>
  );
}

/* ======================================================
   SERVICE CARD
====================================================== */
function ServiceCard({ service, layout, lang }) {
  const T = (v) => resolveTranslated(v, lang);
  const { icon, image, title, description, price } = service;

  /* ICONS LAYOUT */
  if (layout === "icons") {
    return (
      <div className="text-center p-6 rounded-2xl hover:scale-105 transition">
        {icon && (
          <div className="text-5xl mb-4" style={{ color: "var(--color-primary)" }}>
            {icon}
          </div>
        )}

        <h3 className="text-xl font-bold mb-2">
          {T(title)}
        </h3>

        {description && (
          <p className="text-sm opacity-80">
            {T(description)}
          </p>
        )}
      </div>
    );
  }

  /* MINIMAL LAYOUT */
  if (layout === "minimal") {
    return (
      <div className="p-4 text-center">
        <h3 className="text-lg font-semibold mb-1">
          {T(title)}
        </h3>
        {description && (
          <p className="text-sm opacity-70">
            {T(description)}
          </p>
        )}
      </div>
    );
  }

  /* DEFAULT: CARD LAYOUT */
  return (
    <div
      className="rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      {image && (
        <img
          src={image}
          className="w-full h-48 object-cover"
          alt={T(title)}
        />
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">
          {T(title)}
        </h3>

        {description && (
          <p className="text-sm opacity-80 mb-4">
            {T(description)}
          </p>
        )}

        {price && (
          <div
            className="font-semibold text-lg"
            style={{ color: "var(--color-primary)" }}
          >
            {T(price)}
          </div>
        )}
      </div>
    </div>
  );
}
