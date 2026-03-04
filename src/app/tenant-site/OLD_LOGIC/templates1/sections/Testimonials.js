"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function Testimonials({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  const {
    variant = "grid",
    title,
    subtitle,
    testimonials = [],
    show_photos = true,
    show_ratings = true,
    show_company = true,
    background = "background",
  } = content;

  /* ---------------- THEME ---------------- */
  const bgStyle = resolveBackground(
    typeof background === "object" ? background.value : background
  );

  const textStyle = resolveTextColor("default");
  const mutedText = resolveTextColor("muted");

  return (
    <section
      className="px-6 md:px-12 py-20"
      style={{
        ...bgStyle,
        color: "var(--text-color)",
      }}
    >
      <div className="max-w-6xl mx-auto">

        {(title || subtitle) && (
          <div className="text-center mb-14">
            {title && (
              <h2 className="text-4xl font-bold mb-4">
                {T(title)}
              </h2>
            )}
            {subtitle && (
              <p className="text-xl" style={mutedText}>
                {T(subtitle)}
              </p>
            )}
          </div>
        )}

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => {
            const text = T(t.text || t.quote);
            const name = T(t.name || t.author);
            const company = T(t.company || t.role);

            return (
              <div
                key={idx}
                className="rounded-2xl p-8 shadow-lg transition hover:shadow-xl"
                style={{
                  background: "var(--color-background)",
                }}
              >
                {/* Ratings */}
                {show_ratings && t.rating && (
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5"
                        style={{
                          color:
                            i < t.rating
                              ? "var(--color-accent)"
                              : "var(--color-border, #e5e7eb)",
                        }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}

                {/* Quote */}
                <p className="mb-6 italic" style={mutedText}>
                  “{text}”
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {show_photos && t.photo && (
                    <img
                      src={t.photo}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}

                  <div>
                    <div className="font-semibold">
                      {name}
                    </div>

                    {show_company && company && (
                      <div className="text-sm" style={mutedText}>
                        {company}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
