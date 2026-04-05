"use client";

import { resolveTranslated } from "../../src/app/tenant-site/templates/utils/lang";
import { useTenantLang } from "../../src/app/tenant-site/templates/utils/TenantLangContext";

export default function CTA({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { variant = "banner", style = "gradient", title, subtitle, button_label, button_url = "#", secondary_button, background_color = "#1E3A8A", text_color = "white" } = content;

  const textClass = text_color === "white" ? "text-white" : "text-gray-900";
  const subClass = text_color === "white" ? "text-white/90" : "text-gray-600";

  let bgClass = "";
  let bgStyle = {};
  if (style === "gradient") bgClass = "bg-gradient-to-r from-blue-600 to-purple-600";
  else if (style === "solid_color") bgStyle = { backgroundColor: background_color };
  else bgClass = "bg-white border-2 border-gray-200";

  if (variant === "banner") {
    return (
      <section className={`px-6 py-20 ${bgClass}`} style={bgStyle}>
        <div className="max-w-4xl mx-auto text-center">
          {title && <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${textClass}`}>{T(title)}</h2>}
          {subtitle && <p className={`text-xl mb-8 ${subClass}`}>{T(subtitle)}</p>}
          <div className="flex flex-wrap gap-4 justify-center">
            {button_label && (
              <a href={button_url} className={`px-8 py-4 rounded-xl font-semibold shadow-xl ${text_color === "white" ? "bg-white text-blue-600 hover:bg-gray-100" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {T(button_label)}
              </a>
            )}
            {secondary_button && (
              <button className={`px-8 py-4 rounded-xl font-semibold border-2 ${text_color === "white" ? "border-white text-white hover:bg-white/10" : "border-gray-900 text-gray-900 hover:bg-gray-100"}`}>
                {T(secondary_button)}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
            {subtitle && <p className="text-xl text-gray-600 mb-6">{T(subtitle)}</p>}
            {button_label && (
              <a href={button_url} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                {T(button_label)}
              </a>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-gray-400 text-center">Calendar Preview</div>
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // MINIMAL VARIANT
  // ===================================================================
  // ===================================================================
  if (variant === "minimal") {
    const isRTL = lang === "ar" || lang === "ur";

    return (
      <section
        dir={isRTL ? "rtl" : "ltr"}
        className="px-6 md:px-12 py-12"
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-gray-50 rounded-2xl">
          <div>
            {title && (
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {T(title)}
              </h3>
            )}
            {subtitle && (
              <p className="text-gray-600">
                {T(subtitle)}
              </p>
            )}
          </div>

          {button_label && (
            <a
              href={button_url}
              className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all whitespace-nowrap"
              style={{ backgroundColor: background_color || "#3B82F6" }}
            >
              {T(button_label)}
            </a>
          )}
        </div>
      </section>
    );
  }


  return null;
}
