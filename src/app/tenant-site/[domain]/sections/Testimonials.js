"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import {
  resolveTranslated,
  resolveTranslatedArray,
} from "../utils/resolveTranslated";

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function Testimonials({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  useTenantTheme();

  const lang = propLang || language;

  const {
    variant = "grid",
    title,
    subtitle,
    testimonials = [],
    show_photos = true,
    show_ratings = true,
    show_company = true,
  } = data || {};

  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedTestimonials = resolveTranslatedArray(
    testimonials,
    lang,
    ["text", "name", "company", "role"]
  );

  return (
    <section
      className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-text)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold mb-4">
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-[color:var(--color-text-muted)]">
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Testimonials */}
        {resolvedTestimonials.length > 0 ? (
          <TestimonialsLayout variant={variant} isRTL={isRTL}>
            {resolvedTestimonials.map((testimonial, idx) => (
              <TestimonialCard
                key={testimonial.id || idx}
                testimonial={testimonial}
                showPhoto={show_photos}
                showRating={show_ratings}
                showCompany={show_company}
                isRTL={isRTL}
                isCarousel={variant === "carousel"}
              />
            ))}
          </TestimonialsLayout>
        ) : (
          <div className="text-center py-12">
            <p className="text-[color:var(--color-text-muted)]">
              No testimonials available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   LAYOUT SWITCHER
   ========================================================================== */

function TestimonialsLayout({ variant, children, isRTL }) {
  switch (variant) {
    case "carousel":
      return (
        <div
          className={`flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          {children}
        </div>
      );

    case "masonry":
      return (
        <div className="columns-1 md:columns-3 gap-6 space-y-6">
          {children}
        </div>
      );

    case "grid":
    default:
      return (
        <div className="grid md:grid-cols-3 gap-8">
          {children}
        </div>
      );
  }
}

/* ==========================================================================
   TESTIMONIAL CARD
   ========================================================================== */

function TestimonialCard({
  testimonial,
  showPhoto,
  showRating,
  showCompany,
  isRTL,
  isCarousel,
}) {
  return (
    <div
      className={`rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow ${
        isCarousel ? "min-w-[280px] snap-center" : ""
      }`}
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-text)",
      }}
    >
      {/* Rating */}
      {showRating && testimonial.rating && (
        <div
          className={`flex gap-1 mb-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          {[...Array(5)].map((_, i) => (
            <Star key={i} filled={i < testimonial.rating} />
          ))}
        </div>
      )}

      {/* Quote */}
      <p className="mb-6 italic leading-relaxed text-[color:var(--color-text-muted)]">
        “{testimonial.text}”
      </p>

      {/* Author */}
      <div
        className={`flex items-center gap-3 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        {showPhoto && (testimonial.photo || testimonial.avatar) && (
          <img
            src={testimonial.photo || testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}

        {showPhoto && !testimonial.photo && !testimonial.avatar && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {testimonial.name?.charAt(0) || "?"}
          </div>
        )}

        <div className={isRTL ? "text-right" : ""}>
          <div className="font-semibold">
            {testimonial.name}
          </div>

          {showCompany && (testimonial.company || testimonial.role) && (
            <div className="text-sm text-[color:var(--color-text-muted)]">
              {testimonial.role && <span>{testimonial.role}</span>}
              {testimonial.role && testimonial.company && <span> · </span>}
              {testimonial.company && <span>{testimonial.company}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   STAR ICON
   ========================================================================== */

function Star({ filled }) {
  return (
    <svg
      className={`w-5 h-5 ${
        filled ? "text-yellow-400" : "text-gray-300"
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
