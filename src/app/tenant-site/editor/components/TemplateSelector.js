// components/builder/TemplateSelector.js
"use client";

import { useState, useEffect } from "react";
import { X, Search, Layout, Check, Eye, Grid, Star, Sparkles } from "lucide-react";
import { useBuilder } from "../context/BuilderContext";
import { fetchTemplates, fetchTemplate } from "../api/builderApi";
import { resolveTranslated } from "../../[domain]/utils/resolveTranslated";
import { useTenantLang } from "../../contexts/TenantLangContext";

export default function TemplateSelector({ isOpen, onClose, onSelectTemplate }) {
  const { language, isRTL } = useTenantLang();
  
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [step, setStep] = useState(1); // 1 = select template, 2 = select layout

  const T = (v) => resolveTranslated(v, language);

  // Labels
  const labels = {
    title: {
      en: "Choose a Template",
      ar: "اختر قالبًا",
      ur: "ٹیمپلیٹ منتخب کریں",
    },
    searchPlaceholder: {
      en: "Search templates...",
      ar: "البحث في القوالب...",
      ur: "ٹیمپلیٹس تلاش کریں...",
    },
    allCategories: {
      en: "All",
      ar: "الكل",
      ur: "سب",
    },
    selectLayout: {
      en: "Select a Layout",
      ar: "اختر تخطيطًا",
      ur: "لے آؤٹ منتخب کریں",
    },
    layoutsAvailable: {
      en: "layouts available",
      ar: "تخطيطات متاحة",
      ur: "لے آؤٹ دستیاب",
    },
    preview: {
      en: "Preview",
      ar: "معاينة",
      ur: "پیش نظارہ",
    },
    useTemplate: {
      en: "Use This Template",
      ar: "استخدم هذا القالب",
      ur: "یہ ٹیمپلیٹ استعمال کریں",
    },
    back: {
      en: "Back",
      ar: "رجوع",
      ur: "واپس",
    },
    loading: {
      en: "Loading templates...",
      ar: "جار تحميل القوالب...",
      ur: "ٹیمپلیٹس لوڈ ہو رہے ہیں...",
    },
    error: {
      en: "Failed to load templates",
      ar: "فشل تحميل القوالب",
      ur: "ٹیمپلیٹس لوڈ کرنے میں ناکام",
    },
    retry: {
      en: "Retry",
      ar: "إعادة المحاولة",
      ur: "دوبارہ کوشش کریں",
    },
    recommended: {
      en: "Recommended",
      ar: "موصى به",
      ur: "تجویز کردہ",
    },
    premium: {
      en: "Premium",
      ar: "مميز",
      ur: "پریمیم",
    },
    noResults: {
      en: "No templates found",
      ar: "لم يتم العثور على قوالب",
      ur: "کوئی ٹیمپلیٹ نہیں ملا",
    },
    cancel: {
      en: "Cancel",
      ar: "إلغاء",
      ur: "منسوخ",
    },
    failedToLoad: {
      en: "Failed to load template",
      ar: "فشل تحميل القالب",
      ur: "ٹیمپلیٹ لوڈ کرنے میں ناکام",
    },
  };

  // Fetch templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTemplates();
      const templatesData = data.results || data || [];
      setTemplates(templatesData);
      
      // Extract unique categories from API data
      const uniqueCategories = [...new Set(
        templatesData
          .map(t => t.template_type)
          .filter(Boolean)
      )];
      setCategories(uniqueCategories);
      
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter templates by search and category
  const filteredTemplates = templates.filter((template) => {
    const name = T(template.name)?.toLowerCase() || "";
    const description = T(template.description)?.toLowerCase() || "";
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || template.template_type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle template selection - fetch full details with layouts
  const handleSelectTemplate = async (template) => {
    try {
      // Fetch full template details to get layouts array
      const fullTemplate = await fetchTemplate(template.slug);
      setSelectedTemplate(fullTemplate);
      setSelectedLayout(null);
      setStep(2);
    } catch (err) {
      console.error("Failed to fetch template details:", err);
      alert(T(labels.failedToLoad));
    }
  };

  // Handle layout selection
  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
  };

  // Apply selected template + layout
  const handleApplyTemplate = () => {
    if (!selectedTemplate || !selectedLayout) return;

    onSelectTemplate({
      template: selectedTemplate,
      layout: selectedLayout,
      sections: selectedLayout.sections || [],
      theme: selectedTemplate.theme_defaults || {},
    });
    
    onClose();
  };

  // Preview layout in new tab
  const handlePreviewLayout = (template, layout) => {
    const url = `/tenant-site/templates/${template.slug}/layouts/${layout.layout_id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 ? T(labels.title) : T(labels.selectLayout)}
              </h2>
              {selectedTemplate && step === 2 && (
                <p className="text-sm text-gray-500">
                  {T(selectedTemplate.name)} • {selectedTemplate.layouts?.length || 0}{" "}
                  {T(labels.layoutsAvailable)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">{T(labels.loading)}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-red-500">
                <p>{T(labels.error)}</p>
                <button
                  onClick={loadTemplates}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {T(labels.retry)}
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              {/* Search & Filters */}
              <div className={`px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${
                      isRTL ? "right-3" : "left-3"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder={T(labels.searchPlaceholder)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"
                    }`}
                  />
                </div>

                {/* Category Filter - Dynamic from API */}
                <div className={`flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {T(labels.allCategories)}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category === "online_services" ? "Online Services" : 
                       category === "digital_services" ? "Digital Services" : 
                       category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{T(labels.noResults)}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id || template.slug}
                        template={template}
                        labels={labels}
                        language={language}
                        isRTL={isRTL}
                        onSelect={() => handleSelectTemplate(template)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Step 2: Layout Selection */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedTemplate?.layouts || []).map((layout) => (
                  <LayoutCard
                    key={layout.layout_id}
                    layout={layout}
                    template={selectedTemplate}
                    isSelected={selectedLayout?.layout_id === layout.layout_id}
                    labels={labels}
                    language={language}
                    isRTL={isRTL}
                    onSelect={() => handleSelectLayout(layout)}
                    onPreview={() => handlePreviewLayout(selectedTemplate, layout)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 ${isRTL ? "flex-row-reverse" : ""}`}>
          {step === 2 ? (
            <>
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedLayout(null);
                  setSelectedTemplate(null);
                }}
                className={`px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <span>{isRTL ? "→" : "←"}</span> {T(labels.back)}
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!selectedLayout}
                className={`px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Check className="w-4 h-4" />
                {T(labels.useTemplate)}
              </button>
            </>
          ) : (
            <div className={isRTL ? "mr-auto" : "ml-auto"}>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {T(labels.cancel)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({ template, labels, language, isRTL, onSelect }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <button
      onClick={onSelect}
      className={`group text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all overflow-hidden ${isRTL ? "text-right" : ""}`}
    >
      {/* Preview Image */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {template.preview_url ? (
          <img
            src={template.preview_url}
            alt={T(template.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layout className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className={`absolute top-3 flex gap-2 ${isRTL ? "right-3" : "left-3"}`}>
          {template.is_premium && (
            <span className={`px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Star className="w-3 h-3" />
              {T(labels.premium)}
            </span>
          )}
          {template.is_recommended && (
            <span className={`px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Sparkles className="w-3 h-3" />
              {T(labels.recommended)}
            </span>
          )}
        </div>

        {/* Layouts Count */}
        <div className={`absolute bottom-3 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg ${isRTL ? "left-3" : "right-3"}`}>
          {template.layouts?.length || template.layouts_count || 0}{" "}
          {T(labels.layoutsAvailable)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {T(template.name)}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">
          {T(template.description)}
        </p>
        <div className="mt-2">
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {template.template_type === "online_services" ? "Online Services" : 
             template.template_type === "digital_services" ? "Digital Services" : 
             template.template_type}
          </span>
        </div>
      </div>
    </button>
  );
}

// Layout Card Component
function LayoutCard({ layout, template, isSelected, labels, language, isRTL, onSelect, onPreview }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <div
      className={`group relative bg-white rounded-2xl border-2 transition-all overflow-hidden ${
        isSelected
          ? "border-blue-500 ring-4 ring-blue-100"
          : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
      }`}
    >
      {/* Preview Area */}
      <button
        onClick={onSelect}
        className={`w-full aspect-[4/3] bg-gray-100 relative overflow-hidden ${isRTL ? "text-right" : "text-left"}`}
      >
        {layout.preview_url || template.preview_url ? (
          <img
            src={layout.preview_url || template.preview_url}
            alt={T(layout.layout_name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layout className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <div className={`absolute top-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ${isRTL ? "left-3" : "right-3"}`}>
            <Check className="w-5 h-5 text-white" />
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4">
        <div className={`flex items-start justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h4 className="font-semibold text-gray-900 mb-1">
              {T(layout.layout_name)}
            </h4>
            {layout.description && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {T(layout.description)}
              </p>
            )}
          </div>

          {/* Preview Button */}
          <button
            onClick={onPreview}
            className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title={T(labels.preview)}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}