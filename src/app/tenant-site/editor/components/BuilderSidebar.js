"use client";

/**
 * BuilderSidebar.js
 * 
 * Complete sidebar with:
 * - Sections tab with all blocks including modules
 * - Pages tab for page management with edit mode switching
 * - Theme tab with working colors/fonts
 * - Settings tab
 * 
 * UPDATED: Page editing mode support - switch between Home and pages
 */

import { useState } from "react";
import { useBuilder } from "../context/BuilderContext";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated } from "../../[domain]/utils/resolveTranslated";
import { getSectionPresets, getSectionCategories, getModulePresets } from "../api/builderApi";
import {
  Layers,
  Palette,
  Settings,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Edit2,
  ExternalLink,
  MessageSquare,
  Upload,
  CreditCard,
  Globe,
  Search,
  Home,
  ArrowLeft,
  Check,
} from "lucide-react";

export default function BuilderSidebar() {
  const { language, isRTL } = useTenantLang();
  const {
    state,
    currentBlocks,
    currentEditingPage,
    addSection,
    removeSection,
    duplicateSection,
    moveSection,
    setActiveSection,
    clearActiveSection,
    setSidebarTab,
    setThemeColor,
    setThemeFont,
    setThemeRadius,
    setThemeConfig,
    addPage,
    updatePage,
    deletePage,
    editHomePage,
    editPage,
  } = useBuilder();

  const T = (v) => resolveTranslated(v, language);

  const [expandedCategories, setExpandedCategories] = useState(["hero", "content", "modules"]);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = getSectionCategories();
  const sectionPresets = getSectionPresets();
  const modulePresets = getModulePresets();

  const labels = {
    sections: { en: "Sections", ar: "الأقسام", ur: "سیکشنز" },
    pages: { en: "Pages", ar: "الصفحات", ur: "صفحات" },
    theme: { en: "Theme", ar: "السمة", ur: "تھیم" },
    settings: { en: "Settings", ar: "الإعدادات", ur: "ترتیبات" },
    currentSections: { en: "Current Sections", ar: "الأقسام الحالية", ur: "موجودہ سیکشنز" },
    currentBlocks: { en: "Page Blocks", ar: "كتل الصفحة", ur: "پیج بلاکس" },
    blocksLibrary: { en: "Blocks Library", ar: "مكتبة الكتل", ur: "بلاکس لائبریری" },
    colors: { en: "Colors", ar: "الألوان", ur: "رنگ" },
    fonts: { en: "Fonts", ar: "الخطوط", ur: "فونٹس" },
    noSections: { en: "No sections yet", ar: "لا توجد أقسام بعد", ur: "ابھی تک کوئی سیکشن نہیں" },
    noBlocks: { en: "No blocks yet", ar: "لا توجد كتل بعد", ur: "ابھی تک کوئی بلاک نہیں" },
    borderRadius: { en: "Border Radius", ar: "نصف قطر الحدود", ur: "بارڈر ریڈیس" },
    shadow: { en: "Shadow", ar: "الظل", ur: "شیڈو" },
    searchBlocks: { en: "Search blocks...", ar: "البحث في الكتل...", ur: "بلاکس تلاش کریں..." },
    createPage: { en: "Create Page", ar: "إنشاء صفحة", ur: "صفحہ بنائیں" },
    noPages: { en: "No pages yet", ar: "لا توجد صفحات بعد", ur: "ابھی تک کوئی صفحہ نہیں" },
    homePage: { en: "Home Page", ar: "الصفحة الرئيسية", ur: "ہوم پیج" },
    modules: { en: "Modules", ar: "الوحدات", ur: "ماڈیولز" },
    editingHome: { en: "Editing Home", ar: "تحرير الرئيسية", ur: "ہوم میں ترمیم" },
    editingPage: { en: "Editing Page", ar: "تحرير الصفحة", ur: "صفحہ میں ترمیم" },
    backToHome: { en: "Back to Home", ar: "العودة للرئيسية", ur: "ہوم پر واپس" },
    clickToEdit: { en: "Click to edit", ar: "انقر للتحرير", ur: "ترمیم کے لیے کلک کریں" },
  };

  // Tab content
  const tabs = [
    { id: "sections", icon: Layers, label: labels.sections },
    { id: "pages", icon: FileText, label: labels.pages },
    { id: "theme", icon: Palette, label: labels.theme },
    { id: "settings", icon: Settings, label: labels.settings },
  ];

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle adding a section from library
  const handleAddSection = (preset) => {
    const newSection = {
      section_type: preset.type,
      module_key: preset.moduleKey || null,
      content: {
        ...preset.defaultContent,
        ...(preset.variant && { variant: preset.variant }),
      },
    };
    addSection(newSection);
  };

  // Handle drag start on existing section
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("sectionIndex", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over on section list
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Handle drop to reorder
  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("sectionIndex"));
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      moveSection(fromIndex, toIndex);
    }
    setDragOverIndex(null);
  };

  // Filter blocks by search
  const filterBlocks = (blocks) => {
    if (!searchQuery) return blocks;
    return blocks.filter((block) => {
      const name = T(block.name).toLowerCase();
      const desc = T(block.description).toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
    });
  };

  return (
    <aside
      className={`w-80 bg-white border-slate-200 flex flex-col overflow-hidden flex-shrink-0 ${
        isRTL ? "border-l" : "border-r"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Editing Mode Indicator */}
      <EditingModeIndicator
        editingMode={state.editingMode}
        currentEditingPage={currentEditingPage}
        onBackToHome={editHomePage}
        labels={labels}
        language={language}
        isRTL={isRTL}
        T={T}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                state.sidebarTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {T(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* SECTIONS TAB */}
        {state.sidebarTab === "sections" && (
          <SectionsTab
            state={state}
            currentBlocks={currentBlocks}
            labels={labels}
            categories={categories}
            sectionPresets={sectionPresets}
            modulePresets={modulePresets}
            expandedCategories={expandedCategories}
            dragOverIndex={dragOverIndex}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            toggleCategory={toggleCategory}
            handleAddSection={handleAddSection}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            setDragOverIndex={setDragOverIndex}
            setActiveSection={setActiveSection}
            duplicateSection={duplicateSection}
            removeSection={removeSection}
            filterBlocks={filterBlocks}
            language={language}
            isRTL={isRTL}
            T={T}
          />
        )}

        {/* PAGES TAB */}
        {state.sidebarTab === "pages" && (
          <PagesTab
            state={state}
            labels={labels}
            addPage={addPage}
            updatePage={updatePage}
            deletePage={deletePage}
            editHomePage={editHomePage}
            editPage={editPage}
            language={language}
            isRTL={isRTL}
            T={T}
          />
        )}

        {/* THEME TAB */}
        {state.sidebarTab === "theme" && (
          <ThemeTab
            state={state}
            labels={labels}
            setThemeColor={setThemeColor}
            setThemeFont={setThemeFont}
            setThemeRadius={setThemeRadius}
            setThemeConfig={setThemeConfig}
            language={language}
            isRTL={isRTL}
            T={T}
          />
        )}

        {/* SETTINGS TAB */}
        {state.sidebarTab === "settings" && (
          <SettingsTab
            state={state}
            language={language}
            isRTL={isRTL}
            T={T}
          />
        )}
      </div>
    </aside>
  );
}

// ============================================================
// EDITING MODE INDICATOR
// ============================================================

function EditingModeIndicator({ editingMode, currentEditingPage, onBackToHome, labels, language, isRTL, T }) {
  if (editingMode === "layout") {
    return (
      <div className={`px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 ${isRTL ? "text-right" : ""}`}>
        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">{T(labels.editingHome)}</p>
            <p className="text-xs text-blue-600">{T({ en: "Main landing page sections", ar: "أقسام الصفحة الرئيسية", ur: "مین لینڈنگ پیج سیکشنز" })}</p>
          </div>
        </div>
      </div>
    );
  }

  // Editing a specific page
  const pageTitle = currentEditingPage?.title 
    ? (typeof currentEditingPage.title === "object" 
        ? currentEditingPage.title[language] || currentEditingPage.title.en 
        : currentEditingPage.title)
    : "Page";

  return (
    <div className={`px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100`}>
      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <button
          onClick={onBackToHome}
          className="p-1.5 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          title={T(labels.backToHome)}
        >
          <ArrowLeft className={`w-4 h-4 text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>
        <div className={isRTL ? "text-right" : ""}>
          <p className="text-sm font-semibold text-purple-900">{T(labels.editingPage)}</p>
          <p className="text-xs text-purple-600">/{currentEditingPage?.slug || "page"} - {pageTitle}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTIONS TAB
// ============================================================

function SectionsTab({
  state,
  currentBlocks,
  labels,
  categories,
  sectionPresets,
  modulePresets,
  expandedCategories,
  dragOverIndex,
  searchQuery,
  setSearchQuery,
  toggleCategory,
  handleAddSection,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setDragOverIndex,
  setActiveSection,
  duplicateSection,
  removeSection,
  filterBlocks,
  language,
  isRTL,
  T,
}) {
  const isEditingPage = state.editingMode === "page";
  const sectionListLabel = isEditingPage ? labels.currentBlocks : labels.currentSections;
  const emptySectionLabel = isEditingPage ? labels.noBlocks : labels.noSections;

  return (
    <div className="p-4 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? "right-3" : "left-3"}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={T(labels.searchBlocks)}
          className={`w-full py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}`}
        />
      </div>

      {/* Current Sections/Blocks List */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {T(sectionListLabel)}
        </h3>

        {currentBlocks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {T(emptySectionLabel)}
          </div>
        ) : (
          <div className="space-y-2">
            {currentBlocks.map((section, index) => (
              <SectionListItem
                key={section.id || index}
                section={section}
                index={index}
                isActive={state.activeSectionIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={() => setDragOverIndex(null)}
                onClick={() => setActiveSection(section, index)}
                onDuplicate={() => duplicateSection(index)}
                onRemove={() => removeSection(index)}
                isRTL={isRTL}
                T={T}
              />
            ))}
          </div>
        )}
      </div>

      {/* Blocks Library */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {T(labels.blocksLibrary)}
        </h3>

        <div className="space-y-2">
          {/* Regular section categories */}
          {categories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const categoryPresets = sectionPresets.find((p) => p.category === category.id);
            const filteredBlocks = filterBlocks(categoryPresets?.blocks || []);

            if (searchQuery && filteredBlocks.length === 0) return null;

            return (
              <CategoryAccordion
                key={category.id}
                category={category}
                isExpanded={isExpanded}
                blocks={filteredBlocks}
                onToggle={() => toggleCategory(category.id)}
                onAddBlock={handleAddSection}
                isRTL={isRTL}
                T={T}
              />
            );
          })}

          {/* Modules Category */}
          <ModulesCategory
            isExpanded={expandedCategories.includes("modules")}
            modules={filterBlocks(modulePresets)}
            onToggle={() => toggleCategory("modules")}
            onAddModule={handleAddSection}
            isRTL={isRTL}
            T={T}
            labels={labels}
          />
        </div>
      </div>
    </div>
  );
}

function SectionListItem({
  section,
  index,
  isActive,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onClick,
  onDuplicate,
  onRemove,
  isRTL,
  T,
}) {
  const getSectionIcon = () => {
    if (section.section_type === "module") {
      switch (section.module_key) {
        case "chat": return "💬";
        case "file_upload": return "📁";
        case "payment": return "💳";
        default: return "📦";
      }
    }
    const icons = {
      header: "📌",
      hero: "🎯",
      services: "🏷️",
      testimonials: "⭐",
      pricing_table: "💰",
      faq_accordion: "❓",
      gallery: "🖼️",
      stats_banner: "📊",
      cta: "📢",
      footer: "📋",
      steps: "👣",
      features_icons: "✨",
    };
    return icons[section.section_type] || "📝";
  };

  const getDisplayName = () => {
    if (section.section_type === "module" && section.module_key) {
      return section.module_key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return section.section_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={`group flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? "border-blue-500 bg-blue-50"
          : isDragOver
          ? "border-blue-300 bg-blue-50/50"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <GripVertical className="w-4 h-4 text-slate-400 cursor-grab flex-shrink-0" />
      <span className="text-lg flex-shrink-0">{getSectionIcon()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{getDisplayName()}</p>
        {section.content?.variant && (
          <p className="text-xs text-slate-500 truncate">{section.content.variant}</p>
        )}
      </div>
      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? "flex-row-reverse" : ""}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1 text-slate-400 hover:text-blue-600 rounded"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-slate-400 hover:text-red-600 rounded"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CategoryAccordion({ category, isExpanded, blocks, onToggle, onAddBlock, isRTL, T }) {
  if (blocks.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 p-3 text-left hover:bg-slate-50 transition-colors ${isRTL ? "flex-row-reverse text-right" : ""}`}
      >
        <span className="text-lg">{category.icon}</span>
        <span className="flex-1 text-sm font-medium text-slate-900">{T(category.name)}</span>
        <span className="text-xs text-slate-400">{blocks.length}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className={`w-4 h-4 text-slate-400 ${isRTL ? "rotate-180" : ""}`} />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200 p-2 space-y-1 bg-slate-50">
          {blocks.map((preset, idx) => (
            <BlockItem key={idx} preset={preset} onAdd={() => onAddBlock(preset)} isRTL={isRTL} T={T} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModulesCategory({ isExpanded, modules, onToggle, onAddModule, isRTL, T, labels }) {
  return (
    <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/30">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 p-3 text-left hover:bg-purple-50 transition-colors ${isRTL ? "flex-row-reverse text-right" : ""}`}
      >
        <span className="text-lg">🔌</span>
        <span className="flex-1 text-sm font-medium text-purple-900">{T(labels.modules)}</span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Core</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-purple-400" />
        ) : (
          <ChevronRight className={`w-4 h-4 text-purple-400 ${isRTL ? "rotate-180" : ""}`} />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-purple-200 p-2 space-y-1 bg-white">
          {modules.map((module, idx) => (
            <ModuleItem key={idx} module={module} onAdd={() => onAddModule(module)} isRTL={isRTL} T={T} />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockItem({ preset, onAdd, isRTL, T }) {
  return (
    <button
      onClick={onAdd}
      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-white hover:shadow-sm transition-all group ${isRTL ? "flex-row-reverse text-right" : ""}`}
    >
      <span className="text-xl">{preset.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{T(preset.name)}</p>
        <p className="text-xs text-slate-500 truncate">{T(preset.description)}</p>
      </div>
      <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
    </button>
  );
}

function ModuleItem({ module, onAdd, isRTL, T }) {
  const ModuleIcon = module.reactIcon;

  return (
    <button
      onClick={onAdd}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-purple-50 hover:shadow-sm transition-all group border border-transparent hover:border-purple-200 ${isRTL ? "flex-row-reverse text-right" : ""}`}
    >
      <div className="p-2 bg-purple-100 rounded-lg">
        {ModuleIcon ? <ModuleIcon className="w-5 h-5 text-purple-600" /> : <span className="text-xl">{module.icon}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{T(module.name)}</p>
        <p className="text-xs text-slate-500 truncate">{T(module.description)}</p>
      </div>
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Required</span>
    </button>
  );
}

// ============================================================
// PAGES TAB - UPDATED
// ============================================================

function PagesTab({ state, labels, addPage, updatePage, deletePage, editHomePage, editPage, language, isRTL, T }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageTitle, setNewPageTitle] = useState({ en: "", ar: "", ur: "" });

  const handleCreatePage = () => {
    if (!newPageSlug.trim()) return;

    addPage({
      slug: newPageSlug.toLowerCase().replace(/\s+/g, "-"),
      title: {
        en: newPageTitle.en || newPageSlug,
        ar: newPageTitle.ar || newPageSlug,
        ur: newPageTitle.ur || newPageSlug,
      },
      content_blocks: [],
      is_published: true,
    });

    setNewPageSlug("");
    setNewPageTitle({ en: "", ar: "", ur: "" });
    setShowCreateModal(false);
  };

  const isEditingHome = state.editingMode === "layout";

  return (
    <div className="p-4 space-y-6">
      {/* Home Page (Current Layout) */}
      <div
        onClick={editHomePage}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && editHomePage()}
        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
          isEditingHome
            ? "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50"
            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
        }`}
      >
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`p-2 rounded-lg shadow-sm ${isEditingHome ? "bg-blue-600" : "bg-white"}`}>
            <Home className={`w-5 h-5 ${isEditingHome ? "text-white" : "text-blue-600"}`} />
          </div>
          <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
            <p className="font-medium text-slate-900">{T(labels.homePage)}</p>
            <p className="text-xs text-slate-500">{T({ en: "Main landing page", ar: "الصفحة الرئيسية", ur: "مین لینڈنگ پیج" })}</p>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              {state.sections.length} {T({ en: "sections", ar: "أقسام", ur: "سیکشنز" })}
            </span>
            {isEditingHome && (
              <Check className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div>
        <div className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {T({ en: "Additional Pages", ar: "صفحات إضافية", ur: "اضافی صفحات" })}
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3 h-3" />
            {T(labels.createPage)}
          </button>
        </div>

        {state.pages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{T(labels.noPages)}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              {T({ en: "Create your first page", ar: "أنشئ صفحتك الأولى", ur: "اپنا پہلا صفحہ بنائیں" })}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {state.pages.map((page) => (
              <PageListItem
                key={page.id}
                page={page}
                isEditing={state.editingMode === "page" && state.editingPageId === page.id}
                onEdit={() => editPage(page.id)}
                onDelete={() => {
                  if (confirm(T({ en: "Delete this page?", ar: "حذف هذه الصفحة؟", ur: "یہ صفحہ حذف کریں؟" }))) {
                    deletePage(page.id);
                  }
                }}
                isRTL={isRTL}
                T={T}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <CreatePageModal
          newPageSlug={newPageSlug}
          setNewPageSlug={setNewPageSlug}
          newPageTitle={newPageTitle}
          setNewPageTitle={setNewPageTitle}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePage}
          isRTL={isRTL}
          T={T}
          language={language}
        />
      )}
    </div>
  );
}

function PageListItem({ page, isEditing, onEdit, onDelete, isRTL, T, language }) {
  const title = typeof page.title === "object" ? page.title[language] || page.title.en : page.title;
  const blocksCount = page.content_blocks?.length || 0;

  return (
    <div
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onEdit()}
      className={`w-full group flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
        isEditing
          ? "border-purple-500 bg-purple-50"
          : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
      } ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <FileText className={`w-5 h-5 flex-shrink-0 ${isEditing ? "text-purple-600" : "text-slate-400"}`} />
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
        <p className="text-xs text-slate-500">/{page.slug}</p>
      </div>
      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
          {blocksCount} {blocksCount === 1 ? "block" : "blocks"}
        </span>
        {isEditing ? (
          <Check className="w-5 h-5 text-purple-600" />
        ) : (
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-slate-400 hover:text-red-600 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreatePageModal({ newPageSlug, setNewPageSlug, newPageTitle, setNewPageTitle, onClose, onCreate, isRTL, T, language }) {
  const [activeTab, setActiveTab] = useState("en");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {T({ en: "Create New Page", ar: "إنشاء صفحة جديدة", ur: "نیا صفحہ بنائیں" })}
        </h3>

        <div className="space-y-4">
          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {T({ en: "Page URL Slug", ar: "رابط الصفحة", ur: "صفحہ کا URL" })}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">/</span>
              <input
                type="text"
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="about-us"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Title with language tabs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">
                {T({ en: "Page Title", ar: "عنوان الصفحة", ur: "صفحہ کا عنوان" })}
              </label>
              <div className="flex gap-1">
                {["en", "ar", "ur"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-2 py-0.5 text-xs rounded ${
                      activeTab === lang
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={newPageTitle[activeTab]}
              onChange={(e) => setNewPageTitle({ ...newPageTitle, [activeTab]: e.target.value })}
              placeholder={T({ en: "About Us", ar: "من نحن", ur: "ہمارے بارے میں" })}
              dir={["ar", "ur"].includes(activeTab) ? "rtl" : "ltr"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {T({ en: "Cancel", ar: "إلغاء", ur: "منسوخ کریں" })}
          </button>
          <button
            onClick={onCreate}
            disabled={!newPageSlug.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {T({ en: "Create Page", ar: "إنشاء الصفحة", ur: "صفحہ بنائیں" })}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// THEME TAB
// ============================================================

function ThemeTab({ state, labels, setThemeColor, setThemeFont, setThemeRadius, setThemeConfig, language, isRTL, T }) {
  const colors = state.themeConfig.colors || {};
  const fonts = state.themeConfig.fonts || {};

  // Color groups
  const colorGroups = [
    {
      title: { en: "Brand Colors", ar: "ألوان العلامة التجارية", ur: "برانڈ رنگ" },
      colors: ["primary", "secondary", "accent"],
    },
    {
      title: { en: "Background Colors", ar: "ألوان الخلفية", ur: "پس منظر رنگ" },
      colors: ["background", "background_soft"],
    },
    {
      title: { en: "Text Colors", ar: "ألوان النص", ur: "ٹیکسٹ رنگ" },
      colors: ["text", "text_muted"],
    },
    {
      title: { en: "Status Colors", ar: "ألوان الحالة", ur: "اسٹیٹس رنگ" },
      colors: ["success", "warning", "error"],
    },
    {
      title: { en: "Other", ar: "أخرى", ur: "دیگر" },
      colors: ["border"],
    },
  ];

  const fontOptions = [
    { value: "Inter, system-ui, sans-serif", label: "Inter" },
    { value: "Roboto, sans-serif", label: "Roboto" },
    { value: "Poppins, sans-serif", label: "Poppins" },
    { value: "Open Sans, sans-serif", label: "Open Sans" },
    { value: "Montserrat, sans-serif", label: "Montserrat" },
    { value: "Plus Jakarta Sans, system-ui, sans-serif", label: "Plus Jakarta Sans" },
    { value: "Playfair Display, serif", label: "Playfair Display" },
    { value: "Merriweather, serif", label: "Merriweather" },
    { value: "Cairo, sans-serif", label: "Cairo (Arabic)" },
    { value: "Noto Nastaliq Urdu, serif", label: "Noto Nastaliq Urdu" },
    { value: "Amiri, serif", label: "Amiri (Arabic)" },
  ];

  const radiusOptions = [
    { value: "0", label: "None (0px)" },
    { value: "4px", label: "Small (4px)" },
    { value: "8px", label: "Medium (8px)" },
    { value: "12px", label: "Large (12px)" },
    { value: "16px", label: "XL (16px)" },
    { value: "24px", label: "Round (24px)" },
    { value: "9999px", label: "Full" },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Colors */}
      {colorGroups.map((group) => (
        <div key={group.title.en}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {T(group.title)}
          </h3>
          <div className="space-y-3">
            {group.colors.map((colorKey) => (
              <ColorInput
                key={colorKey}
                label={colorKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                value={colors[colorKey] || "#000000"}
                onChange={(val) => setThemeColor(colorKey, val)}
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Fonts */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {T(labels.fonts)}
        </h3>
        <div className="space-y-3">
          <div>
            <label className={`block text-sm font-medium text-slate-700 mb-1 ${isRTL ? "text-right" : ""}`}>
              {T({ en: "Base Font", ar: "الخط الأساسي", ur: "بیس فونٹ" })}
            </label>
            <select
              value={fonts.base || "Inter, system-ui, sans-serif"}
              onChange={(e) => setThemeFont("base", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            >
              {fontOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium text-slate-700 mb-1 ${isRTL ? "text-right" : ""}`}>
              {T({ en: "Heading Font", ar: "خط العناوين", ur: "ہیڈنگ فونٹ" })}
            </label>
            <select
              value={fonts.heading || "Plus Jakarta Sans, system-ui, sans-serif"}
              onChange={(e) => setThemeFont("heading", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            >
              {fontOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {T(labels.borderRadius)}
        </h3>
        <select
          value={state.themeConfig.radius || "8px"}
          onChange={(e) => setThemeRadius(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
        >
          {radiusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {T({ en: "Preview", ar: "معاينة", ur: "پیش نظارہ" })}
        </h3>
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: colors.background || "#FFFFFF",
            borderRadius: state.themeConfig.radius || "8px",
            border: `1px solid ${colors.border || "#E5E7EB"}`,
          }}
        >
          <h4
            style={{
              color: colors.text || "#1F2937",
              fontFamily: fonts.heading || "Plus Jakarta Sans",
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            {T({ en: "Sample Heading", ar: "عنوان نموذجي", ur: "سیمپل ہیڈنگ" })}
          </h4>
          <p
            style={{
              color: colors.text_muted || "#6B7280",
              fontFamily: fonts.base || "Inter",
              fontSize: "14px",
              marginBottom: "12px",
            }}
          >
            {T({ en: "This is sample text to preview your theme.", ar: "هذا نص نموذجي لمعاينة السمة.", ur: "یہ آپ کی تھیم کے پیش نظارہ کے لیے سیمپل ٹیکسٹ ہے۔" })}
          </p>
          <button
            style={{
              backgroundColor: colors.primary || "#7C3AED",
              color: "#FFFFFF",
              padding: "8px 16px",
              borderRadius: state.themeConfig.radius || "8px",
              fontFamily: fonts.base || "Inter",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            {T({ en: "Button", ar: "زر", ur: "بٹن" })}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange, isRTL }) {
  return (
    <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 capitalize">{label}</p>
        <p className="text-xs text-slate-500 font-mono">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================

function SettingsTab({ state, language, isRTL, T }) {
  return (
    <div className="p-4 space-y-6">
      <div className={`text-center py-8 text-slate-400 ${isRTL ? "text-right" : ""}`}>
        <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm font-medium mb-2">{T({ en: "Site Settings", ar: "إعدادات الموقع", ur: "سائٹ کی ترتیبات" })}</p>
        <p className="text-xs">{T({ en: "Coming soon...", ar: "قريبًا...", ur: "جلد آ رہا ہے..." })}</p>
      </div>

      {/* Preview of what's coming */}
      <div className="space-y-2">
        {[
          { en: "SEO Settings", ar: "إعدادات SEO", ur: "SEO سیٹنگز" },
          { en: "Analytics Integration", ar: "تكامل التحليلات", ur: "اینالیٹکس انٹیگریشن" },
          { en: "Custom Domain", ar: "نطاق مخصص", ur: "کسٹم ڈومین" },
          { en: "Social Links", ar: "روابط التواصل", ur: "سوشل لنکس" },
          { en: "Contact Info", ar: "معلومات الاتصال", ur: "رابطہ کی معلومات" },
        ].map((item, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3 opacity-50">
            <div className="w-2 h-2 bg-slate-300 rounded-full" />
            <span className="text-sm text-slate-500">{T(item)}</span>
            <span className="ml-auto text-xs text-slate-400">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}