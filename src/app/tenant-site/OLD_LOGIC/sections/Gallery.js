"use client";

import { useState } from "react";
import { useTenantLang } from "../../templates/utils/TenantLangContext";
import { resolveTranslated } from "../../templates/utils/lang";

export default function Gallery({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  // ✅ SAME AS HERO
  const content = data?.content || data || {};

  const {
    title,
    subtitle,
    images = [],
    layout = "grid",
    columns = 3,
    show_filter = false,
    filter_categories = [],
  } = content;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const ALL_LABEL = T({ en: "All", ar: "الكل", ur: "سب" });
  const [activeFilter, setActiveFilter] = useState(ALL_LABEL);

  // ============================================
  // Normalize images (Hero-style translation)
  // ============================================
  const resolvedImages = images.map((img) => ({
    ...img,
    caption: T(img.caption),
    category: T(img.category),
    alt: T(img.alt),
  }));

  const resolvedFilters = [
    ALL_LABEL,
    ...filter_categories.map((f) => T(f)),
  ];

  // ============================================
  // Filtering
  // ============================================
  const filteredImages =
    activeFilter === ALL_LABEL
      ? resolvedImages
      : resolvedImages.filter((img) => img.category === activeFilter);

  // ============================================
  // Layout
  // ============================================
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

  // ============================================
  // Lightbox
  // ============================================
  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () =>
    setActiveIndex((prev) => (prev + 1) % filteredImages.length);

  const prevImage = () =>
    setActiveIndex(
      (prev) => (prev - 1 + filteredImages.length) % filteredImages.length
    );

  // ============================================
  // Render
  // ============================================
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-4xl font-bold mb-4">{T(title)}</h2>}
            {subtitle && <p className="text-xl text-gray-600">{T(subtitle)}</p>}
          </div>
        )}

        {/* Filters */}
        {show_filter && resolvedFilters.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {resolvedFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setActiveIndex(0);
                }}
                className={`px-4 py-2 rounded-full text-sm
                  ${
                    activeFilter === filter
                      ? "bg-black text-white"
                      : "bg-gray-100"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Gallery */}
        {layout === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto">
            {filteredImages.map((image, idx) => (
              <div
                key={idx}
                className="min-w-[280px] cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={image.src}
                  alt={image.alt || image.caption}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={getGridClass()}>
            {filteredImages.map((image, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={image.src}
                  alt={image.alt || image.caption}
                  className="w-full aspect-square object-cover group-hover:scale-110 transition"
                />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && filteredImages.length > 0 && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <img
              src={filteredImages[activeIndex]?.src}
              className="max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />

            <button onClick={prevImage} className="absolute left-4 text-white text-4xl">
              ‹
            </button>

            <button onClick={nextImage} className="absolute right-4 text-white text-4xl">
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}