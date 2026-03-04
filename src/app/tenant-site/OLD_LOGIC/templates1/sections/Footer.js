"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function Footer({ data }) {
  const { lang } = useTenantLang();
  const content = data?.content || data || {};
  const T = (v) => resolveTranslated(v, lang);

  const {
    variant = "multi_column",
    business_name,
    tagline,
    logo_url,
    columns = [],
    social_links = [],
    copyright,
    background = "background",
  } = content;

  /* ---------------- THEME STYLES ---------------- */
  const bgStyle = resolveBackground(background);

  const textStyle = resolveTextColor(
    background === "dark" ? "inverse" : "default"
  );

  const mutedTextStyle = resolveTextColor("muted");

  /* ================= MULTI COLUMN ================= */
  if (variant === "multi_column") {
    return (
      <footer
        className="pt-16 pb-10"
        style={{
          ...bgStyle,
          ...textStyle,
          color: "var(--text-color)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">

            {/* BRAND */}
            <div className="lg:col-span-2">
              {logo_url ? (
                <img src={logo_url} className="h-10 mb-4" />
              ) : (
                <h3 className="text-2xl font-bold mb-4">
                  {T(business_name)}
                </h3>
              )}

              {tagline && (
                <p
                  className="text-sm mb-6"
                  style={{
                    ...mutedTextStyle,
                    color: "var(--text-color)",
                  }}
                >
                  {T(tagline)}
                </p>
              )}

              {/* SOCIAL LINKS */}
              {social_links.length > 0 && (
                <div className="flex gap-4">
                  {social_links.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition"
                      style={{
                        background: "var(--color-background-soft)",
                        color: "var(--color-text)",
                      }}
                    >
                      {getSocialIcon(s.platform)}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* LINK COLUMNS */}
            {columns.map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold mb-4">
                  {T(col.title)}
                </h4>

                <ul className="space-y-3">
                  {col.links?.map((lnk, j) => (
                    <li key={j}>
                      <a
                        href={lnk.url}
                        className="text-sm hover:underline"
                        style={{
                          ...mutedTextStyle,
                          color: "var(--text-color)",
                        }}
                      >
                        {T(lnk.label)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          {/* BOTTOM */}
          <div
            className="pt-8 text-center"
            style={{
              borderTop: "1px solid var(--color-border, #e5e7eb)",
            }}
          >
            <p
              className="text-sm"
              style={{
                ...mutedTextStyle,
                color: "var(--text-color)",
              }}
            >
              {copyright
                ? T(copyright)
                : `© ${new Date().getFullYear()} ${T(business_name)}. All rights reserved.`}
            </p>
          </div>

        </div>
      </footer>
    );
  }

  return null;
}

/* ================= SOCIAL ICONS ================= */
function getSocialIcon(platform) {
  const icons = {
    facebook: "📘",
    instagram: "📸",
    linkedin: "🔗",
    twitter: "🐦",
    youtube: "▶️",
  };
  return icons[platform?.toLowerCase()] || "🌐";
}
