/**
 * Website Editor - Main Page
 * app/tenant-site/editor/page.js
 * 
 * Main entry point for the website builder editor.
 * Provides all necessary context providers and orchestrates
 * the editor components.
 * 
 * UPDATED: Handles saving both layout sections and page content_blocks
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BuilderProvider, useBuilder } from "./context/BuilderContext";
import TenantThemeProvider from "../contexts/TenantThemeContext";
import { TenantLangProvider, useTenantLang } from "../contexts/TenantLangContext";
import { resolveTranslated } from "../[domain]/utils/resolveTranslated";
import { useApp } from "@/contexts/AppContext";

import BuilderSidebar from "./components/BuilderSidebar";
import BuilderCanvas from "./components/BuilderCanvas";
import BuilderTopbar from "./components/BuilderTopbar";
import PropertiesPanel from "./components/PropertiesPanel";
import TemplateSelector from "./components/TemplateSelector";

import {
  fetchTenantSiteFull,
  fetchTemplate,
  fetchTemplateLayout,
  saveTenantSiteConfig,
  saveTenantLayout,
  saveTenantPages,
} from "./api/builderApi";

// ============================================================
// LOADING FALLBACK
// ============================================================

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-600">Loading editor...</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN EDITOR CONTENT
// ============================================================

function EditorContent() {
  const { language, isRTL } = useTenantLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenants, activeTenant } = useApp();
  
  const {
    state,
    currentBlocks,
    currentEditingPage,
    setTemplate,
    setLayout,
    setSections,
    setPages,
    setThemeConfig,
    loadState,
    setSaving,
    setSaved,
  } = useBuilder();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [initialTemplateCheckDone, setInitialTemplateCheckDone] = useState(false);

  // Get domain from URL params
  const domain = searchParams.get("domain");

  // Resolve tenantId from domain
  const tenant = tenants?.find(
    (t) => t.primary_domain?.domain === domain
  );
  const tenantId = tenant?.id || activeTenant || null;

  // Translation helper
  const T = (v) => resolveTranslated(v, language);

  // Labels
  const labels = {
    loading: { en: "Loading editor...", ar: "جارٍ تحميل المحرر...", ur: "ایڈیٹر لوڈ ہو رہا ہے..." },
    error: { en: "Failed to load", ar: "فشل التحميل", ur: "لوڈ کرنے میں ناکام" },
    noTenant: { en: "No tenant selected", ar: "لم يتم اختيار مستأجر", ur: "کوئی ٹیننٹ منتخب نہیں" },
    noDomain: { en: "No domain specified", ar: "لم يتم تحديد نطاق", ur: "کوئی ڈومین متعین نہیں" },
    saveFailed: { en: "Save failed", ar: "فشل الحفظ", ur: "محفوظ کرنے میں ناکام" },
    selectTenant: { en: "Please select a tenant first", ar: "يرجى اختيار مستأجر أولاً", ur: "پہلے ٹیننٹ منتخب کریں" },
    saveSuccess: { en: "Saved successfully", ar: "تم الحفظ بنجاح", ur: "کامیابی سے محفوظ ہو گیا" },
  };

  // Redirect if no domain
  useEffect(() => {
    if (!domain) {
      router.replace("/dashboard");
    }
  }, [domain, router]);

  // Load existing site configuration
  useEffect(() => {
    async function loadSiteConfig() {
      if (!tenantId || !domain) {
        setIsLoading(false);
        setShowTemplateSelector(true);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const siteData = await fetchTenantSiteFull(domain);
        console.log("Loaded site data:", siteData);
        
        if (siteData) {
          loadState({
            pages: siteData.pages || [],
            sections: siteData.sections || [],
            themeConfig: {
              colors: siteData.theme?.colors || state.themeConfig.colors,
              fonts: siteData.theme?.fonts || state.themeConfig.fonts,
              radius: siteData.theme?.radius || state.themeConfig.radius,
            },
            selectedTemplate: siteData.template || null,
          });

          // Show template selector if no sections and not checked before
          if (!siteData.sections?.length && !initialTemplateCheckDone) {
            setShowTemplateSelector(true);
          }
        } else {
          setShowTemplateSelector(true);
        }

        setInitialTemplateCheckDone(true);
      } catch (err) {
        console.error("Failed to load site config:", err);
        setError(err.message);
        setShowTemplateSelector(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadSiteConfig();
  }, [tenantId, domain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle template selection
  const handleSelectTemplate = async (template, layoutId) => {
    try {
      setIsLoading(true);

      const layoutData = await fetchTemplateLayout(template.slug, layoutId);

      if (layoutData) {
        setTemplate(template);
        setLayout(layoutData.layout);
        setSections(layoutData.layout?.sections || []);

        if (layoutData.theme_defaults) {
          setThemeConfig(layoutData.theme_defaults);
        }
      }

      setShowTemplateSelector(false);
    } catch (err) {
      console.error("Failed to load template:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template selection from modal
  const handleTemplateSelection = ({ template, layout, sections, theme }) => {
    setTemplate(template);
    setLayout(layout);
    setSections(sections);
    if (theme) {
      setThemeConfig(theme);
    }
    setShowTemplateSelector(false);
  };

  // ============================================================
  // SAVE HANDLER - Saves layout, theme, and all pages
  // ============================================================
  const handleSave = async () => {
    if (!tenantId) {
      alert(T(labels.selectTenant));
      return;
    }

    try {
      setSaving();

      // Build save payload
      const savePayload = {
        // Main layout sections (Home page)
        sections: state.sections,
        // Theme configuration
        theme_config: state.themeConfig,
        
        // All pages with their content_blocks
        pages: state.pages.map(page => ({
          id: page.id,
          slug: page.slug,
          title: page.title,
          content_blocks: page.content_blocks || [],
          is_published: page.is_published,
          seo_title: page.seo_title || "",
          seo_description: page.seo_description || "",
          order: page.order,
          })),
        };


      // Use bulk save endpoint
      await saveTenantSiteConfig(tenantId, savePayload);

      setSaved();
      
      // Optional: Show success toast
      // toast.success(T(labels.saveSuccess));
      console.log("Saving:", state.isSaving);

      
    } catch (err) {
      console.error("Failed to save:", err);
      alert(`${T(labels.saveFailed)}: ${err.message}`);
      // ✅ Ensure spinner stops on error too
      setSaved();
    } 
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-600">{T(labels.loading)}</p>
        </div>
      </div>
    );
  }

  // If no sections and template selector is shown, render only the modal
  if (showTemplateSelector && state.sections.length === 0) {
    return (
      <TemplateSelector
        isOpen={showTemplateSelector}
        onSelectTemplate={handleTemplateSelection}
        onClose={() => setShowTemplateSelector(false)}
      />
    );
  }

  return (
    <div 
      className="h-screen flex flex-col bg-slate-100 overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top Bar */}
      <BuilderTopbar
        onSave={handleSave}
        onSelectTemplate={() => setShowTemplateSelector(true)}
        tenantId={tenantId}
        domain={domain}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex overflow-hidden ${isRTL ? "flex-row-reverse" : ""}`}>
        {/* Sidebar - Hidden in preview mode */}
        {!state.previewMode && <BuilderSidebar />}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <BuilderCanvas domain={domain} />
        </div>

        {/* Properties Panel - Hidden in preview mode or when no section selected */}
        {!state.previewMode && state.activeSection && <PropertiesPanel />}
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onSelectTemplate={handleTemplateSelection}
        onClose={() => setShowTemplateSelector(false)}
      />
    </div>
  );
}

// ============================================================
// SEARCH PARAMS WRAPPER (Required for useSearchParams in Next.js 13+)
// ============================================================

function EditorWithSearchParams() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorContent />
    </Suspense>
  );
}

// ============================================================
// WRAPPED EXPORT WITH PROVIDERS
// ============================================================

export default function WebsiteEditorPage() {
  return (
    <TenantLangProvider>
      <BuilderProvider>
        <EditorWithSearchParams />
      </BuilderProvider>
    </TenantLangProvider>
  );
}