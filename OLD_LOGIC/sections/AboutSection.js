"use client";

import { useTenantLang } from "../../src/app/tenant-site/templates/utils/TenantLangContext";
import { resolveTranslated } from "../../src/app/tenant-site/templates/utils/lang";

export default function AboutSection({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  // ✅ SAME AS HERO
  const content = data?.content || data || {};

  const {
    variant = "split",
    title,
    subtitle,
    content: body,
    image,
    highlights = [],
    cta_text,
    cta_link,
  } = content;

  // ============================================
  // SPLIT
  // ============================================
  if (variant === "split") {
    return (
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* Image */}
          {image && (
            <img
              src={image}
              alt={T(title) || "About"}
              className="rounded-2xl shadow-xl w-full object-cover"
            />
          )}

          {/* Content */}
          <div>
            {subtitle && (
              <p className="text-sm font-semibold text-blue-600 mb-2">
                {T(subtitle)}
              </p>
            )}

            {title && (
              <h2 className="text-4xl font-bold mb-6">
                {T(title)}
              </h2>
            )}

            {body && (
              <div
                className="text-gray-600 mb-6"
                dangerouslySetInnerHTML={{ __html: T(body) }}
              />
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <ul className="space-y-3 mb-8">
                {highlights.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span>✓</span>
                    {T(item.title || item)}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            {cta_text && (
              <a
                href={cta_link || "#"}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl"
              >
                {T(cta_text)}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // CENTERED
  // ============================================
  if (variant === "centered") {
    return (
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">

          {title && (
            <h2 className="text-4xl font-bold mb-6">
              {T(title)}
            </h2>
          )}

          {image && (
            <img
              src={image}
              alt={T(title)}
              className="rounded-2xl shadow-xl mb-8"
            />
          )}

          {body && (
            <div
              className="text-gray-600 mb-8"
              dangerouslySetInnerHTML={{ __html: T(body) }}
            />
          )}

          {cta_text && (
            <a
              href={cta_link || "#"}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl"
            >
              {T(cta_text)}
            </a>
          )}
        </div>
      </section>
    );
  }

  return null;
}