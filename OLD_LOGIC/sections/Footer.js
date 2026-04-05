"use client";

import { resolveTranslated } from "../../src/app/tenant-site/templates/utils/lang";
import { useTenantLang } from "../../src/app/tenant-site/templates/utils/TenantLangContext";

/**
 * FOOTER SECTION
 * Variants: multi_column, minimal, centered
 */
export default function Footer({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};

  const {
    variant = "multi_column",
    business_name,
    tagline,
    logo_url,
    columns = [],
    social_links = [],
    copyright,
    background = "light",
  } = content;

  const bgClass = {
    dark: "bg-gray-900 text-white",
    gradient: "bg-gradient-to-br from-blue-700 to-purple-700 text-white",
    light: "bg-gray-50 text-gray-900",
  }[background];

  const subTextClass = background === "light" ? "text-gray-600" : "text-gray-400";

  // ========== MULTI-COLUMN ==========
  if (variant === "multi_column") {
    return (
      <footer className={`${bgClass} pt-16 pb-10`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              {logo_url ? (
                <img src={logo_url} alt="" className="h-10 mb-4" />
              ) : (
                <h3 className="text-2xl font-bold mb-4">{T(business_name)}</h3>
              )}
              {tagline && (
                <p className={`text-sm mb-6 ${subTextClass}`}>{T(tagline)}</p>
              )}
              {social_links.length > 0 && (
                <div className="flex gap-4">
                  {social_links.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                    >
                      {getSocialIcon(s.platform)}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link Columns */}
            {columns.map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{T(col.title)}</h4>
                <ul className="space-y-3">
                  {col.links?.map((lnk, j) => (
                    <li key={j}>
                      <a href={lnk.url} className={`text-sm hover:underline ${subTextClass}`}>
                        {T(lnk.label)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className={`text-sm ${subTextClass}`}>
              {T(copyright) || `© ${new Date().getFullYear()} ${T(business_name)}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // ========== MINIMAL ==========
  if (variant === "minimal") {
    return (
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">
            {T(copyright) || `© ${new Date().getFullYear()} ${T(business_name)}`}
          </p>
        </div>
      </footer>
    );
  }

  // ========== CENTERED ==========
  if (variant === "centered") {
    return (
      <footer className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {logo_url ? (
            <img src={logo_url} className="h-12 mx-auto mb-4" alt="" />
          ) : (
            <h3 className="text-2xl font-bold mb-3">{T(business_name)}</h3>
          )}
          {tagline && <p className="text-gray-600 mb-8">{T(tagline)}</p>}

          <nav className="flex flex-wrap justify-center gap-6 mb-8">
            {columns.flatMap((c) => c.links || []).map((lnk, i) => (
              <a key={i} href={lnk.url} className="text-gray-600 hover:text-gray-900 text-sm">
                {T(lnk.label)}
              </a>
            ))}
          </nav>

          <p className="text-gray-500 text-sm">
            {T(copyright) || `© ${new Date().getFullYear()} ${T(business_name)}`}
          </p>
        </div>
      </footer>
    );
  }

  return null;
}

function getSocialIcon(platform) {
  const icons = { facebook: "📘", instagram: "📸", linkedin: "🔗", twitter: "🐦", youtube: "▶️" };
  return icons[platform?.toLowerCase()] || "🌐";
}
