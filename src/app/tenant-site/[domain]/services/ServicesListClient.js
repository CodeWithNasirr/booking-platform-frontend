// src/app/tenant-site/[domain]/services/ServicesListClient.js
"use client";

/**
 * ServicesListClient — Services listing with filters
 *
 * Shows all services in a grid with category filter tabs and search.
 * Uses the ServiceCard component.
 */

import { useState, useMemo } from "react";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated } from "../utils/resolveTranslated";
import LayoutRenderer from "../LayoutRenderer";
import ServiceCard from "@/components/services/ServiceCard";

export default function ServicesListClient({
  services = [],
  domain,
  site,
  header,
  footer,
}) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = language;

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const primaryColor = theme.primary_color || "#3B82F6";

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Map();
    services.forEach((s) => {
      if (s.category) {
        const catId = s.category.id || s.category.slug || "uncategorized";
        const catName =
          typeof s.category === "object"
            ? resolveTranslated(s.category.name, lang)
            : s.category.name || s.category;
        cats.set(catId, catName);
      }
    });
    return Array.from(cats, ([id, name]) => ({ id, name }));
  }, [services, lang]);

  // Filter services
  const filtered = useMemo(() => {
    return services.filter((s) => {
      // Category filter
      if (categoryFilter !== "all") {
        const catId = s.category?.id || s.category?.slug;
        if (catId !== categoryFilter) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = resolveTranslated(s.name, lang).toLowerCase();
        const desc = resolveTranslated(
          s.short_description || s.description,
          lang
        ).toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }

      return true;
    });
  }, [services, categoryFilter, search, lang]);

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && (
        <LayoutRenderer sections={headerSection} language={lang} site={site} />
      )}

      <main className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Page header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {resolveTranslated(
                {
                  en: "Our Services",
                  ar: "خدماتنا",
                  ur: "ہماری خدمات",
                },
                lang
              )}
            </h1>
            <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">
              {resolveTranslated(
                {
                  en: "Browse our professional services and get started today.",
                  ar: "تصفح خدماتنا المهنية وابدأ اليوم.",
                  ur: "ہماری پیشہ ورانہ خدمات دیکھیں اور آج ہی شروع کریں۔",
                },
                lang
              )}
            </p>
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Category tabs */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === "all"
                      ? "text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                  style={
                    categoryFilter === "all"
                      ? { backgroundColor: primaryColor }
                      : {}
                  }
                >
                  {resolveTranslated(
                    { en: "All", ar: "الكل", ur: "سب" },
                    lang
                  )}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === cat.id
                        ? "text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                    style={
                      categoryFilter === cat.id
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={resolveTranslated(
                  {
                    en: "Search services...",
                    ar: "بحث عن خدمات...",
                    ur: "خدمات تلاش کریں...",
                  },
                  lang
                )}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-400 mb-6">
            {filtered.length}{" "}
            {resolveTranslated(
              {
                en: "services found",
                ar: "خدمة",
                ur: "خدمات ملیں",
              },
              lang
            )}
          </p>

          {/* Services grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  mode="database"
                  lang={lang}
                  isRTL={isRTL}
                  theme={theme}
                  variant="card"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg text-gray-500">
                {resolveTranslated(
                  {
                    en: "No services found",
                    ar: "لم يتم العثور على خدمات",
                    ur: "کوئی خدمات نہیں ملیں",
                  },
                  lang
                )}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  {resolveTranslated(
                    {
                      en: "Clear search",
                      ar: "مسح البحث",
                      ur: "تلاش صاف کریں",
                    },
                    lang
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {footerSection.length > 0 && (
        <LayoutRenderer sections={footerSection} language={lang} site={site} />
      )}
    </>
  );
}