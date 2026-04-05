"use client";

import { useState } from "react";
import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Gallery({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    title,
    subtitle,
    images = [],
    layout = "grid", // grid, masonry, carousel
    columns = 3,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedImages = resolveTranslatedArray(images, lang, ["caption", "alt"]);

  const colClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns] || "md:grid-cols-3";

  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % resolvedImages.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length);
  };

  return (
    <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-7xl mx-auto">
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

        {/* Gallery Grid */}
        <div className={`grid ${colClass} gap-4`}>
          {resolvedImages.map((image, idx) => (
            <div 
              key={image.id || idx}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={image.src || image.url || image}
                alt={image.alt || image.caption || `Gallery image ${idx + 1}`}
                className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>

              {/* Caption */}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white hover:opacity-70"
              onClick={closeLightbox}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation */}
            <button 
              className="absolute left-4 text-white hover:opacity-70"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button 
              className="absolute right-4 text-white hover:opacity-70"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={resolvedImages[activeIndex]?.src || resolvedImages[activeIndex]?.url || resolvedImages[activeIndex]}
              alt={resolvedImages[activeIndex]?.alt || `Image ${activeIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
              {activeIndex + 1} / {resolvedImages.length}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
