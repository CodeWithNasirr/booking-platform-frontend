"use client";

/**
 * PreviewClient.js
 * 
 * Client component that renders inside the iframe.
 * Handles:
 * - Receiving state updates from parent via postMessage
 * - Rendering sections using LayoutRenderer pattern
 * - Sending click/hover events back to parent
 * - Managing selection overlays in edit mode
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import TenantThemeProvider from "../../contexts/TenantThemeContext";
import { TenantLangProvider, useTenantLang } from "../../contexts/TenantLangContext";
import mapSectionToComponent from "../../[domain]/utils/mapSectionToComponent";
import { resolveTranslatedContent } from "../../[domain]/utils/resolveTranslated";
import {
  MESSAGE_TYPES,
  isBuilderMessage,
  createSectionClickedMessage,
  createSectionHoveredMessage,
  createIframeReadyMessage,
  createIframeHeightMessage,
  retrievePreviewState,
} from "../utils/editorMessaging";
import { mapHeaderData, mapHeroData, mapServicesSectionData, mapStatsBannerData, mapAboutData, mapTeamData, mapGalleryData, mapContactFormData } from "../../[domain]/LayoutRenderer";

// ============================================================
// MAIN PREVIEW CLIENT
// ============================================================

export default function PreviewClient({ initialState }) {
 
  const [sections, setSections] = useState(initialState?.sections || []);
  const [theme, setTheme] = useState(initialState?.theme || {});
  const [language, setLanguage] = useState(initialState?.language || "en");
  const [previewMode, setPreviewMode] = useState(initialState?.previewMode || false);
  const [selectedIndex, setSelectedIndex] = useState(initialState?.selectedIndex ?? null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [domain, setDomain] = useState(null);


  const containerRef = useRef(null);

  // ============================================================
  // MESSAGE HANDLING
  // ============================================================

  useEffect(() => {
    const handleMessage = (event) => {
      if (!isBuilderMessage(event)) return;

      const { type, payload } = event.data;

      switch (type) {
        case MESSAGE_TYPES.UPDATE_SECTIONS:
          setSections(payload.sections || []);
          break;

        case MESSAGE_TYPES.UPDATE_THEME:
          setTheme(payload.theme || {});
          break;

        case MESSAGE_TYPES.SET_LANGUAGE:
          setLanguage(payload.language || "en");
          break;

        case MESSAGE_TYPES.SELECT_SECTION:
          setSelectedIndex(payload.index);
          break;

        case MESSAGE_TYPES.HIGHLIGHT_SECTION:
          setHoveredIndex(payload.index);
          break;

        case MESSAGE_TYPES.SET_PREVIEW_MODE:
          setPreviewMode(payload.enabled);
          break;

        case MESSAGE_TYPES.SCROLL_TO_SECTION:
          scrollToSection(payload.index);
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ============================================================
  // NOTIFY PARENT WHEN READY
  // ============================================================

  useEffect(() => {
    // Try to load initial state from sessionStorage
    const stored = retrievePreviewState();
    if (stored) {
      setSections(stored.sections || []);
      setTheme(stored.theme || {});
      setLanguage(stored.language || "en");
      setPreviewMode(stored.previewMode || false);
      setSelectedIndex(stored.selectedIndex ?? null);
      setDomain(stored.domain || null); 
    }

    // Notify parent that iframe is ready
    window.parent.postMessage(createIframeReadyMessage(), "*");
    setIsReady(true);
  }, []);

  // ============================================================
  // REPORT HEIGHT CHANGES
  // ============================================================

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.parent.postMessage(
          createIframeHeightMessage(entry.contentRect.height),
          "*"
        );
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ============================================================
  // SCROLL TO SECTION
  // ============================================================

  const scrollToSection = useCallback((index) => {
    const sectionElement = document.querySelector(`[data-section-index="${index}"]`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // ============================================================
  // SECTION CLICK/HOVER HANDLERS
  // ============================================================

  const handleSectionClick = useCallback((index, section) => {
    if (previewMode) return;
    window.parent.postMessage(createSectionClickedMessage(index, section), "*");
  }, [previewMode]);

  const handleSectionHover = useCallback((index) => {
    if (previewMode) return;
    window.parent.postMessage(createSectionHoveredMessage(index), "*");
  }, [previewMode]);

  // ============================================================
  // DETERMINE RTL
  // ============================================================

  const isRTL = ["ar", "ur", "he", "fa"].includes(language);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <TenantThemeProvider theme={theme}>
      <div
        ref={containerRef}
        className="preview-container min-h-screen w-full overflow-auto"
        dir={isRTL ? "rtl" : "ltr"}
        >
        {/* Empty State */}
        {sections.length === 0 && (
          <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-500">
                {language === "ar"
                  ? "لا توجد أقسام بعد"
                  : language === "ur"
                  ? "ابھی تک کوئی سیکشن نہیں"
                  : "No sections yet"}
              </p>
            </div>
          </div>
        )}

        {/* Render Sections */}
        {sections.map((section, index) => (
          <PreviewSection
            domain={domain}
            key={section.id || index}
            section={section}
            index={index}
            language={language}
            isSelected={selectedIndex === index}
            isHovered={hoveredIndex === index}
            previewMode={previewMode}
            onClick={() => handleSectionClick(index, section)}
            onMouseEnter={() => handleSectionHover(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>
    </TenantThemeProvider>
  );
}

// ============================================================
// PREVIEW SECTION WRAPPER
// ============================================================

function PreviewSection({
  section,
  index,
  language,
  isSelected,
  isHovered,
  previewMode,
  onClick,
  onMouseEnter,
  onMouseLeave,
  domain
}) {
  const isModule = section.section_type === "module";
  const moduleKey = section.module_key || section.content?.module_key;
  
  // Get component
  const Component = mapSectionToComponent(
    section.section_type,
    isModule ? moduleKey : null
  );

  if (!Component) {
    return (
      <div
        data-section-index={index}
        className="p-8 bg-yellow-50 border border-yellow-200 text-yellow-700 text-center"
      >
        ⚠️ Unknown section type: <code>{section.section_type}</code>
      </div>
    );
  }

  // Normalize content based on section type
  let normalizedContent = section.content;

  switch (section.section_type) {
    case "header":
      normalizedContent = mapHeaderData(section.content);
      break;
    case "hero":
      normalizedContent = mapHeroData(section.content);
      break;
    case "services":
      normalizedContent = mapServicesSectionData(section.content);
      break;
    case "stats_banner":
      normalizedContent = mapStatsBannerData(section.content);
      break;
    case "about":
    case "about_section":
      normalizedContent = mapAboutData(section.content);
      break;
    case "team":
    case "team_section":
      normalizedContent = mapTeamData(section.content);
      break;
    case "gallery":
    case "image_gallery":
      normalizedContent = mapGalleryData(section.content);
      break;
    case "contact":
    case "contact_form":
      normalizedContent = mapContactFormData(section.content);
      break;
    default:
      normalizedContent = section.content;
  }

  const resolvedContent = resolveTranslatedContent(normalizedContent, language);

  // In preview mode, just render the section
  if (previewMode) {
    return (
      <div data-section-index={index}>
        {isModule ? (
          <Component
            settings={section.settings || section.content?.settings || {}}
            lang={language}
          />
        ) : (
          <Component data={resolvedContent} lang={language} domain={domain} />
        )}
      </div>
    );
  }

  // In edit mode, add selection overlay
  return (
    <div
      data-section-index={index}
      className={`relative transition-all cursor-pointer ${
        isSelected
          ? "ring-2 ring-blue-500 ring-inset"
          : isHovered
          ? "ring-2 ring-blue-300 ring-inset"
          : ""
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Section Type Label */}
      <div
        className={`absolute top-2 left-2 z-20 px-2 py-1 text-xs font-medium rounded transition-opacity ${
          isSelected
            ? "bg-blue-600 text-white opacity-100"
            : isHovered
            ? "bg-slate-900/70 text-white opacity-100"
            : "opacity-0"
        }`}
      >
        {section.section_type}
        {section.content?.variant && ` • ${section.content.variant}`}
      </div>

      {/* Section Content */}
      <div className={isSelected || isHovered ? "" : ""}>
        {isModule ? (
          <Component
            settings={section.settings || section.content?.settings || {}}
            lang={language}
          />
        ) : (
          <Component data={resolvedContent} lang={language} domain={domain} />
        )}
      </div>

      {/* Selection Overlay */}
      {(isSelected || isHovered) && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isSelected ? "bg-blue-500/5" : "bg-blue-300/5"
          }`}
        />
      )}
    </div>
  );
}