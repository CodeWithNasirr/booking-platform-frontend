"use client";

import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Testimonials({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
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

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedTestimonials = resolveTranslatedArray(testimonials, lang, ["text", "name", "company", "role"]);

  return (
    <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
            )}
          </div>
        )}

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {resolvedTestimonials.map((testimonial, idx) => (
            <TestimonialCard
              key={testimonial.id || idx}
              testimonial={testimonial}
              showPhoto={show_photos}
              showRating={show_ratings}
              showCompany={show_company}
              theme={theme}
              isRTL={isRTL}
            />
          ))}
        </div>

        {/* Empty State */}
        {resolvedTestimonials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No testimonials available.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, showPhoto, showRating, showCompany, theme, isRTL }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
      {/* Rating */}
      {showRating && testimonial.rating && (
        <div className={`flex gap-1 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${
                i < testimonial.rating ? "text-yellow-400" : "text-gray-300"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}

      {/* Quote */}
      <p className="text-gray-700 mb-6 italic leading-relaxed">
        "{testimonial.text}"
      </p>

      {/* Author */}
      <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
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
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {testimonial.name?.charAt(0) || "?"}
          </div>
        )}

        <div className={isRTL ? "text-right" : ""}>
          <div className="font-semibold text-gray-900">{testimonial.name}</div>
          {showCompany && (testimonial.company || testimonial.role) && (
            <div className="text-sm text-gray-500">
              {testimonial.role && <span>{testimonial.role}</span>}
              {testimonial.role && testimonial.company && <span> at </span>}
              {testimonial.company && <span>{testimonial.company}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
