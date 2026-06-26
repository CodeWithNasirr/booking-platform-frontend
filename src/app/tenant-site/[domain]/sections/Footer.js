"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Footer({ data, lang: propLang }) {
  // console.log("Footer data ", data);
  const { language, isRTL } = useTenantLang();
  const lang = propLang || language;
  // console.log("Footer data ", data);
  const {
    logo,
    business_name,
    tagline,
    columns = [],
    social_links = [],
    contact_info = {},
    copyright,
    show_powered_by = true,
    background = "dark",
    cta_banner,
  } = data || {};

  const resolvedTagline = resolveTranslated(tagline, lang);
  const resolvedCopyright = resolveTranslated(copyright, lang);
  // const resolvedColumns = columns.map(col => ({
  //   ...col,
  //   title: resolveTranslated(col.title, lang),
  //   links: resolveTranslatedArray(col.links || [], lang, ["label", "href"]),
  // }));
  const resolvedColumns = columns.map(col => ({
    ...col,
    title: resolveTranslated(col.title, lang),
    links: resolveTranslatedArray(col.links || [], lang, ["label", "href", "url"]).map(link => ({
      ...link,
      // normalise: accept either href or url from the API
      href: link.href || link.url || "#",
    })),
  }));

  /* ================= OLD BACKGROUND LOGIC ================= */

  let bgStyle = {};
  let textClass = "text-[color:var(--color-text)]";
  let mutedClass = "text-[color:var(--color-text-muted)]";
  let borderClass = "border-[color:var(--color-border)]";

  if (background === "dark") {
    // ↓ add #0F172A fallback so it works even without styles.css in scope
    bgStyle = { backgroundColor: "var(--color-dark-bg, #0F172A)" };
    textClass = "text-white";
    mutedClass = "text-white/70";
    borderClass = "border-white/20";
  }

  if (background === "light") {
    bgStyle = { backgroundColor: "var(--color-background, #FFFFFF)" };
  }

  if (background === "gradient") {
    bgStyle = { backgroundColor: "var(--color-primary, #3B82F6)" };
    textClass = "text-white";
    mutedClass = "text-white/70";
    borderClass = "border-white/20";
  }

  // if (background === "dark") {
  //   bgStyle = { backgroundColor: "var(--color-dark-bg)" };
  //   textClass = "text-white";
  //   mutedClass = "text-white/70";
  //   borderClass = "border-white/20";
  // }

  // if (background === "light") {
  //   bgStyle = { backgroundColor: "var(--color-background)" };
  // }

  // if (background === "gradient") {
  //   bgStyle = { backgroundColor: "var(--color-primary)" };
  //   textClass = "text-white";
  //   mutedClass = "text-white/70";
  //   borderClass = "border-white/20";
  // }

  return (
    <footer style={bgStyle} className={isRTL ? "rtl" : ""}>
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* ================= MAIN GRID ================= */}
        <div className={`grid gap-12 ${resolvedColumns.length ? "md:grid-cols-4" : "md:grid-cols-2"}`}>

          {/* Brand */}
          <div>
            {logo ? (
              <img src={logo} alt={business_name} className="h-10 mb-4" />
            ) : (
              business_name && (
                <h3 className={`text-2xl font-bold mb-4 ${textClass}`}>
                  {business_name}
                </h3>
              )
            )}

            {resolvedTagline && (
              <p className={`${mutedClass} mb-6`}>{resolvedTagline}</p>
            )}

            {(contact_info.email || contact_info.phone || contact_info.address) && (
              <div className={`space-y-2 ${mutedClass}`}>
                {contact_info.email && <p>✉️ {contact_info.email}</p>}
                {contact_info.phone && <p>📞 {contact_info.phone}</p>}
                {contact_info.address && (
                  <p>📍 {resolveTranslated(contact_info.address, lang)}</p>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          {resolvedColumns.map((col, idx) => (
            <div key={idx}>
              <h4 className={`font-semibold text-lg mb-4 ${textClass}`}>
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href || "#"}
                      className={`${mutedClass} hover:text-white transition-colors`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ================= CTA BANNER ================= */}
        {cta_banner && (resolveTranslated(cta_banner.title, lang) || resolveTranslated(cta_banner.text, lang)) && (
          <div className={`mt-10 p-6 rounded-2xl text-center ${
            background === "dark" ? "bg-white/10" : "bg-gray-100"
          }`}>
            {resolveTranslated(cta_banner.title, lang) && (
              <p className={`text-lg font-semibold mb-2 ${textClass}`}>
                {resolveTranslated(cta_banner.title, lang)}
              </p>
            )}
            {resolveTranslated(cta_banner.text, lang) && (
              <p className={`text-sm mb-4 ${mutedClass}`}>
                {resolveTranslated(cta_banner.text, lang)}
              </p>
            )}
            {cta_banner.url && (
              <a
                href={cta_banner.url}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary, #3B82F6)" }}
              >
                {resolveTranslated(cta_banner.button_text, lang) ||
                  resolveTranslated({ en: "Request Custom Service", ar: "طلب خدمة مخصصة", ur: "حسب ضرورت سروس کی درخواست" }, lang)}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M19 12H5M12 5l-7 7 7 7" : "M5 12h14M12 5l7 7-7 7"} />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* ================= SOCIAL ================= */}
        {social_links.length > 0 && (
          <div className={`flex gap-4 mt-10 ${isRTL ? "flex-row-reverse" : ""}`}>
            {social_links.map((s, i) => (
              <a
                key={i}
                href={s.url || s.href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`${mutedClass} hover:text-white transition-colors`}
              >
                {s.platform}
              </a>
            ))}
          </div>
        )}

        {/* ================= BOTTOM ================= */}
        <div className={`mt-12 pt-8 border-t ${borderClass} flex flex-col md:flex-row justify-between gap-4`}>
          <p className={mutedClass}>
            {resolvedCopyright ||
              `© ${new Date().getFullYear()} ${business_name || ""}`}
          </p>

          {show_powered_by && (
            <p className={`text-sm ${mutedClass}`}>
              Powered by <span className="font-semibold">YourPlatform</span>
            </p>
          )}
        </div>

      </div>
    </footer>
  );
}
