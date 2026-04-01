"use client";

/**
 * BuilderTopbar.js
 * 
 * Top toolbar for the website builder editor.
 * Contains device preview, save button, and navigation.
 * 
 * UPDATED: Shows editing mode indicator (Home vs Page)
 */

import { useBuilder } from "../context/BuilderContext";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated } from "../../[domain]/utils/resolveTranslated";
import LanguageSwitcher from "../../[domain]/utils/LanguageSwitcher";
import Link from "next/link";
import {
  Save,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Layout,
  ArrowLeft,
  ArrowRight,
  Settings,
  ExternalLink,
  Check,
  Loader2,
  FolderOpen,
  Home,
  FileText,
} from "lucide-react";

export default function BuilderTopbar({ onSave, onSelectTemplate, tenantId, domain }) {
  const { language, isRTL } = useTenantLang();
  const {
    state,
    currentEditingPage,
    setPreviewMode,
    setPreviewDevice,
    editHomePage,
  } = useBuilder();

  const T = (v) => resolveTranslated(v, language);

  const labels = {
    save: { en: "Save", ar: "حفظ", ur: "محفوظ کریں" },
    saving: { en: "Saving...", ar: "جارٍ الحفظ...", ur: "محفوظ ہو رہا ہے..." },
    saved: { en: "Saved", ar: "تم الحفظ", ur: "محفوظ ہو گیا" },
    preview: { en: "Preview", ar: "معاينة", ur: "پیش نظارہ" },
    edit: { en: "Edit", ar: "تحرير", ur: "ترمیم" },
    changeTemplate: { en: "Change Template", ar: "تغيير القالب", ur: "ٹیمپلیٹ تبدیل کریں" },
    viewSite: { en: "View Live Site", ar: "عرض الموقع المباشر", ur: "لائیو سائٹ دیکھیں" },
    back: { en: "Back", ar: "رجوع", ur: "واپس" },
    websiteBuilder: { en: "Website Builder", ar: "منشئ المواقع", ur: "ویب سائٹ بلڈر" },
    unsavedChanges: { en: "Unsaved changes", ar: "تغييرات غير محفوظة", ur: "غیر محفوظ شدہ تبدیلیاں" },
    editingHome: { en: "Editing Home", ar: "تحرير الرئيسية", ur: "ہوم ایڈیٹنگ" },
    editingPage: { en: "Editing", ar: "تحرير", ur: "ایڈیٹنگ" },
  };

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const isEditingPage = state.editingMode === "page";
  const pageTitle = currentEditingPage?.title 
    ? (typeof currentEditingPage.title === "object" 
        ? currentEditingPage.title[language] || currentEditingPage.title.en 
        : currentEditingPage.title)
    : "Page";

  return (
    <header 
      className={`h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-4 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Left Section - Back & Logo */}
      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <BackArrow className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">{T(labels.back)}</span>
        </Link>

        <div className="h-8 w-px bg-slate-200" />

        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 hidden md:inline">
            {T(labels.websiteBuilder)}
          </span>
        </div>

        {/* Editing Mode Indicator */}
        <div className="h-8 w-px bg-slate-200 hidden lg:block" />
        
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full ${
          isEditingPage ? "bg-purple-100" : "bg-blue-100"
        }`}>
          {isEditingPage ? (
            <>
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {T(labels.editingPage)}: /{currentEditingPage?.slug}
              </span>
            </>
          ) : (
            <>
              <Home className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {T(labels.editingHome)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center Section - Device Preview & Mode Toggle */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
        {/* Device Toggles */}
        {Object.entries(deviceIcons).map(([device, Icon]) => (
          <button
            key={device}
            onClick={() => setPreviewDevice(device)}
            className={`p-2 rounded-lg transition-all ${
              state.previewDevice === device
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title={device.charAt(0).toUpperCase() + device.slice(1)}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}

        <div className="h-6 w-px bg-slate-300 mx-1" />

        {/* Preview Toggle */}
        <button
          onClick={() => setPreviewMode(!state.previewMode)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isRTL ? "flex-row-reverse" : ""} ${
            state.previewMode
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-white hover:shadow-sm"
          }`}
        >
          {state.previewMode ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-sm font-medium">{T(labels.edit)}</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{T(labels.preview)}</span>
            </>
          )}
        </button>
      </div>

      {/* Right Section - Actions */}
      <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        {/* Change Template (only when editing home) */}
        {!isEditingPage && (
          <button
            onClick={onSelectTemplate}
            className={`flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium hidden md:inline">{T(labels.changeTemplate)}</span>
          </button>
        )}

        {/* Back to Home (when editing a page) */}
        {isEditingPage && (
          <button
            onClick={editHomePage}
            className={`flex items-center gap-2 px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium hidden md:inline">
              {T({ en: "Back to Home", ar: "العودة للرئيسية", ur: "ہوم پر واپس" })}
            </span>
          </button>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* View Live Site */}
        {domain && (
          <Link
            href={`/tenant-site/${domain}`}
            target="_blank"
            className={`flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:inline">{T(labels.viewSite)}</span>
          </Link>
        )}

        {/* Dirty Indicator */}
        {state.isDirty && (
          <span 
            className="w-2 h-2 bg-orange-500 rounded-full" 
            title={T(labels.unsavedChanges)} 
          />
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={state.isSaving || !state.isDirty}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${isRTL ? "flex-row-reverse" : ""} ${
            state.isSaving
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : state.isDirty
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
              : "bg-green-100 text-green-700"
          }`}
        >
          {state.isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">{T(labels.saving)}</span>
            </>
          ) : !state.isDirty && state.lastSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">{T(labels.saved)}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{T(labels.save)}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}