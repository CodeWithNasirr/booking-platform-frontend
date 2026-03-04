"use client";

import { useState } from "react";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated } from "../utils/resolveTranslated";

export default function Gallery({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const lang = propLang || language;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ALL_LABEL = resolveTranslated({ en: "All", ar: "الكل", ur: "سب" }, lang);
  const [activeFilter, setActiveFilter] = useState(ALL_LABEL);


  const {
    title,
    subtitle,
    images = [],
    layout = "grid", // grid | masonry | carousel
    columns = 3,
    show_filter = false,
    filter_categories = [],
  } = data || {};


  // ============================================================
  // Resolve translations
  // ============================================================
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);

  const resolvedImages = images.map((img) => ({
    ...img,
    caption: resolveTranslated(img.caption, lang),
    category: resolveTranslated(img.category, lang),
    alt: resolveTranslated(img.alt, lang),
  }));

  const resolvedFilters = [
    ALL_LABEL,
    ...filter_categories.map((f) => resolveTranslated(f, lang)),
  ];


  // ============================================================
  // Filtering
  // ============================================================
  const filteredImages =
    activeFilter === ALL_LABEL
      ? resolvedImages
      : resolvedImages.filter((img) => img.category === activeFilter);


  // ============================================================
  // Layout helpers
  // ============================================================
  const colClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns] || "md:grid-cols-3";

  const getGridClass = () => {
    if (layout === "masonry") {
      return `columns-1 sm:columns-2 md:columns-${columns} gap-4`;
    }
    return `grid ${colClass} gap-4`;
  };

  // ============================================================
  // Lightbox handlers
  // ============================================================
  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setActiveIndex(
      (prev) => (prev - 1 + filteredImages.length) % filteredImages.length
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-7xl mx-auto">
        {/* ================= Header ================= */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold mb-4">{resolvedTitle}</h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
            )}
          </div>
        )}

        {/* ================= Filters ================= */}
        {show_filter && resolvedFilters.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {resolvedFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setActiveIndex(0);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition
                  ${
                    activeFilter === filter
                      ? "bg-black text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* ================= Gallery ================= */}
        {layout === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4">
            {filteredImages.map((image, idx) => (
              <div
                key={image.id || idx}
                className="min-w-[280px] sm:min-w-[320px] snap-center relative rounded-xl overflow-hidden cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={image.src}
                  alt={image.alt || image.caption}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={getGridClass()}>
            {filteredImages.map((image, idx) => (
              <div
                key={image.id || idx}
                className={`relative overflow-hidden rounded-xl cursor-pointer group
                  ${layout === "masonry" ? "mb-4 break-inside-avoid" : ""}
                `}
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={image.src}
                  alt={image.alt || image.caption}
                  className="w-full object-cover aspect-square group-hover:scale-110 transition-transform duration-300"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="text-white text-lg">+</span>
                </div>

                {/* Caption */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 opacity-0 group-hover:opacity-100 transition">
                    <p className="text-white text-sm">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ================= Lightbox ================= */}
        {lightboxOpen && filteredImages.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <img
              src={filteredImages[activeIndex]?.src}
              alt={filteredImages[activeIndex]?.alt}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              className="absolute left-4 text-white text-4xl"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              ‹
            </button>

            <button
              className="absolute right-4 text-white text-4xl"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              ›
            </button>

            <div className="absolute bottom-4 text-white">
              {activeIndex + 1} / {filteredImages.length}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
