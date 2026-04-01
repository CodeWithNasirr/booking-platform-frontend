"use client";

/**
 * BuilderCanvas.js
 * 
 * Enhanced iframe-based canvas with:
 * - True device viewport simulation via iframe
 * - Proper height handling (desktop: available space, tablet/mobile: exact device)
 * - Theme CSS variables injection
 * - PostMessage communication with preview
 * - Section selection and highlighting
 * - iOS smooth scrolling support
 * 
 * UPDATED: 
 * - Uses currentBlocks to support page editing mode
 * - Injects theme CSS variables into iframe
 * - Fixed iframe heights for accurate device simulation
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { useBuilder } from "../context/BuilderContext";
import { useTenantLang } from "../../contexts/TenantLangContext";
import {
  MESSAGE_TYPES,
  isBuilderMessage,
  createUpdateSectionsMessage,
  createUpdateThemeMessage,
  createSetLanguageMessage,
  createSelectSectionMessage,
  createSetPreviewModeMessage,
  createScrollToSectionMessage,
  storePreviewState,
} from "../utils/editorMessaging";
import {
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Loader2,
  Home,
  FileText,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";

// ============================================================
// DEVICE CONFIGURATIONS - Accurate Device Dimensions
// ============================================================

const DEVICE_CONFIGS = {
  desktop: {
    width: "100%",
    maxWidth: "100%",
    height: "auto", // Will use available space
    minHeight: "600px",
    label: "Desktop",
    icon: Monitor,
    description: "Full width desktop view",
  },
  tablet: {
    width: "768px",
    maxWidth: "768px",
    height: "1024px", // iPad portrait
    minHeight: "1024px",
    label: "Tablet",
    icon: Tablet,
    description: "768 × 1024 (iPad)",
  },
  mobile: {
    width: "375px",
    maxWidth: "375px",
    height: "812px", // iPhone X/11/12/13
    minHeight: "812px",
    label: "Mobile",
    icon: Smartphone,
    description: "375 × 812 (iPhone)",
  },
};

// ============================================================
// THEME CSS GENERATOR
// ============================================================

function generateThemeCSSVariables(themeConfig) {
  if (!themeConfig) return "";

  const { colors = {}, fonts = {}, radius = "8px", shadow } = themeConfig;

  return `
    :root {
      /* Brand Colors */
      --color-primary: ${colors.primary || "#7C3AED"};
      --color-secondary: ${colors.secondary || "#5B21B6"};
      --color-accent: ${colors.accent || "#A78BFA"};
      
      /* Background Colors */
      --color-background: ${colors.background || "#FFFFFF"};
      --color-background-soft: ${colors.background_soft || "#FAF5FF"};
      
      /* Text Colors */
      --color-text: ${colors.text || "#1F2937"};
      --color-text-muted: ${colors.text_muted || "#6B7280"};
      
      /* Status Colors */
      --color-success: ${colors.success || "#059669"};
      --color-warning: ${colors.warning || "#D97706"};
      --color-error: ${colors.error || "#DC2626"};
      
      /* Border */
      --color-border: ${colors.border || "#E5E7EB"};
      
      /* Typography */
      --font-base: ${fonts.base || "Inter, system-ui, sans-serif"};
      --font-heading: ${fonts.heading || "Plus Jakarta Sans, system-ui, sans-serif"};
      
      /* Sizing */
      --radius: ${radius};
      --shadow: ${shadow || "0 4px 6px -1px rgb(0 0 0 / 0.1)"};
    }
    
    /* Apply theme to common elements */
    body {
      font-family: var(--font-base);
      color: var(--color-text);
      background-color: var(--color-background);
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      color: var(--color-text);
    }
    
    /* Theme utility classes */
    .bg-theme-primary { background-color: var(--color-primary); }
    .bg-theme-secondary { background-color: var(--color-secondary); }
    .bg-theme-accent { background-color: var(--color-accent); }
    .bg-theme-background { background-color: var(--color-background); }
    .bg-theme-background-soft { background-color: var(--color-background-soft); }
    
    .text-theme-primary { color: var(--color-primary); }
    .text-theme-secondary { color: var(--color-secondary); }
    .text-theme-text { color: var(--color-text); }
    .text-theme-muted { color: var(--color-text-muted); }
    
    .border-theme { border-color: var(--color-border); }
    .rounded-theme { border-radius: var(--radius); }
    .shadow-theme { box-shadow: var(--shadow); }
  `;
}

// ============================================================
// MESSAGE TYPE FOR THEME CSS INJECTION
// ============================================================

const EXTENDED_MESSAGE_TYPES = {
  ...MESSAGE_TYPES,
  INJECT_THEME_CSS: "INJECT_THEME_CSS",
};

function createInjectThemeCSSMessage(css) {
  return {
    source: "website-builder",
    type: EXTENDED_MESSAGE_TYPES.INJECT_THEME_CSS,
    payload: { css },
    timestamp: Date.now(),
  };
}

// ============================================================
// BUILDER CANVAS COMPONENT
// ============================================================

export default function BuilderCanvas({domain}) {
  const { language, isRTL } = useTenantLang();
  const {
    state,
    currentBlocks,
    currentEditingPage,
    setActiveSection,
    clearActiveSection,
    addSection,
  } = useBuilder();

  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerHeight, setContainerHeight] = useState("100%");

  // ============================================================
  // CALCULATE CONTAINER HEIGHT
  // ============================================================

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 24; // 24px padding
        setContainerHeight(`${Math.max(availableHeight, 500)}px`);
      }
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  // ============================================================
  // SEND MESSAGES TO IFRAME
  // ============================================================

  const sendToIframe = useCallback((message) => {
    if (iframeRef.current?.contentWindow && iframeReady) {
      iframeRef.current.contentWindow.postMessage(message, "*");
    }
  }, [iframeReady]);

  // ============================================================
  // INJECT THEME CSS INTO IFRAME
  // ============================================================

  const injectThemeCSS = useCallback(() => {
    if (iframeRef.current?.contentWindow && iframeReady) {
      const css = generateThemeCSSVariables(state.themeConfig);
      sendToIframe(createInjectThemeCSSMessage(css));
      
      // Also try direct injection for immediate effect
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        let styleElement = iframeDoc.getElementById("builder-theme-styles");
        
        if (!styleElement) {
          styleElement = iframeDoc.createElement("style");
          styleElement.id = "builder-theme-styles";
          iframeDoc.head.appendChild(styleElement);
        }
        
        styleElement.textContent = css;
      } catch (e) {
        // Cross-origin restriction - rely on postMessage
        console.log("Theme CSS will be applied via postMessage");
      }
    }
  }, [iframeReady, state.themeConfig, sendToIframe]);

  // ============================================================
  // SYNC STATE TO IFRAME
  // ============================================================

  // Store state in sessionStorage for iframe to read on load
  useEffect(() => {
    storePreviewState({
      sections: currentBlocks,
      themeConfig: state.themeConfig,
      language,
      previewMode: state.previewMode,
      activeSectionIndex: state.activeSectionIndex,
      domain,
    });
  }, [currentBlocks, state.themeConfig, language, state.previewMode, state.activeSectionIndex,domain]);

  // Send sections update when they change
  useEffect(() => {
    if (iframeReady) {
      sendToIframe(createUpdateSectionsMessage(currentBlocks));
    }
  }, [currentBlocks, iframeReady, sendToIframe]);

  // Send theme update when it changes
  useEffect(() => {
    if (iframeReady) {
      sendToIframe(createUpdateThemeMessage(state.themeConfig));
      injectThemeCSS();
    }
  }, [state.themeConfig, iframeReady, sendToIframe, injectThemeCSS]);

  // Send language update when it changes
  useEffect(() => {
    if (iframeReady) {
      sendToIframe(createSetLanguageMessage(language));
    }
  }, [language, iframeReady, sendToIframe]);

  // Send preview mode update when it changes
  useEffect(() => {
    if (iframeReady) {
      sendToIframe(createSetPreviewModeMessage(state.previewMode));
    }
  }, [state.previewMode, iframeReady, sendToIframe]);

  // Send selected section update
  useEffect(() => {
    if (iframeReady) {
      sendToIframe(createSelectSectionMessage(state.activeSectionIndex));
    }
  }, [state.activeSectionIndex, iframeReady, sendToIframe]);

  // ============================================================
  // RECEIVE MESSAGES FROM IFRAME
  // ============================================================

  useEffect(() => {
    const handleMessage = (event) => {
      if (!isBuilderMessage(event)) return;

      const { type, payload } = event.data;

      switch (type) {
        case MESSAGE_TYPES.IFRAME_READY:
          setIframeReady(true);
          setIsLoading(false);
          // Send initial state
          setTimeout(() => {
            sendToIframe(createUpdateSectionsMessage(currentBlocks));
            sendToIframe(createUpdateThemeMessage(state.themeConfig));
            sendToIframe(createSetLanguageMessage(language));
            sendToIframe(createSetPreviewModeMessage(state.previewMode));
            injectThemeCSS();
          }, 100);
          break;

        case MESSAGE_TYPES.SECTION_CLICKED:
          if (payload.index !== undefined) {
            setActiveSection(payload.section, payload.index);
          }
          break;

        case MESSAGE_TYPES.SECTION_HOVERED:
          // Could show hover state in sidebar
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentBlocks, state.themeConfig, language, state.previewMode, sendToIframe, setActiveSection, injectThemeCSS]);

  // ============================================================
  // HANDLE IFRAME LOAD
  // ============================================================

  const handleIframeLoad = () => {
    // Wait a moment for the iframe's React to hydrate
    setTimeout(() => {
      if (!iframeReady) {
        setIframeReady(true);
        setIsLoading(false);
        injectThemeCSS();
      }
    }, 500);
  };

  // ============================================================
  // REFRESH IFRAME
  // ============================================================

  const refreshIframe = () => {
    setIsLoading(true);
    setIframeReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // ============================================================
  // OPEN IN NEW TAB
  // ============================================================

  const openInNewTab = () => {
    window.open("/tenant-site/editor/preview", "_blank");
  };

  // ============================================================
  // TOGGLE FULLSCREEN
  // ============================================================

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ============================================================
  // GET IFRAME STYLES - Fixed for accurate device simulation
  // ============================================================

  const deviceConfig = DEVICE_CONFIGS[state.previewDevice];
  
  const getIframeContainerStyle = () => {
    if (state.previewDevice === "desktop") {
      return {
        width: "100%",
        height: isFullscreen ? "100vh" : containerHeight,
        maxWidth: "100%",
      };
    }
    
    // For tablet and mobile - exact device dimensions
    return {
      width: deviceConfig.width,
      maxWidth: deviceConfig.maxWidth,
      height: deviceConfig.height,
      minHeight: deviceConfig.minHeight,
    };
  };

  const getIframeStyle = () => {
    if (state.previewDevice === "desktop") {
      return {
        width: "100%",
        height: "100%",
        minHeight: "500px",
        border: "none",
        overflow: "auto",
        // iOS smooth scrolling
        WebkitOverflowScrolling: "touch",
      };
    }
    
    // For tablet and mobile - exact device dimensions with internal scrolling
    return {
      width: "100%",
      height: "100%",
      border: "none",
      overflow: "auto",
      // iOS smooth scrolling
      WebkitOverflowScrolling: "touch",
    };
  };

  // ============================================================
  // EDITING MODE INFO
  // ============================================================
  
  const isEditingPage = state.editingMode === "page";
  const pageTitle = currentEditingPage?.title 
    ? (typeof currentEditingPage.title === "object" 
        ? currentEditingPage.title[language] || currentEditingPage.title.en 
        : currentEditingPage.title)
    : "Page";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-hidden bg-slate-200/50 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-900/95 p-0" : "p-4"
      }`}
    >
      {/* Canvas Header */}
      <div className={`flex items-center justify-between mb-4 ${
        isFullscreen ? "px-6 pt-4" : ""
      } ${state.previewDevice !== "desktop" ? "max-w-4xl mx-auto w-full" : ""}`}>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {/* Editing Mode Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isEditingPage 
              ? "bg-purple-100 text-purple-700" 
              : "bg-blue-100 text-blue-700"
          } ${isFullscreen ? "bg-opacity-90" : ""}`}>
            {isEditingPage ? (
              <>
                <FileText className="w-4 h-4" />
                <span className="font-medium">/{currentEditingPage?.slug || "page"}</span>
              </>
            ) : (
              <>
                <Home className="w-4 h-4" />
                <span className="font-medium">Home</span>
              </>
            )}
          </div>
          
          <span className={`${isFullscreen ? "text-slate-400" : "text-slate-400"}`}>•</span>
          
          <div className="flex items-center gap-2">
            <deviceConfig.icon className="w-4 h-4" />
            <span className={`font-medium ${isFullscreen ? "text-slate-300" : ""}`}>
              {deviceConfig.label}
            </span>
          </div>
          
          {state.previewDevice !== "desktop" && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              isFullscreen ? "bg-slate-700 text-slate-300" : "bg-slate-200"
            }`}>
              {deviceConfig.width} × {deviceConfig.height}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={refreshIframe}
            className={`p-2 rounded-lg transition-colors ${
              isFullscreen 
                ? "text-slate-400 hover:text-white hover:bg-slate-700" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white"
            }`}
            title="Refresh Preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg transition-colors ${
              isFullscreen 
                ? "text-slate-400 hover:text-white hover:bg-slate-700" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white"
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Open in New Tab */}
          <button
            onClick={openInNewTab}
            className={`p-2 rounded-lg transition-colors ${
              isFullscreen 
                ? "text-slate-400 hover:text-white hover:bg-slate-700" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white"
            }`}
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Container - Centered for mobile/tablet */}
      <div className={`flex-1 flex items-start justify-center overflow-auto ${
        state.previewDevice === "desktop" ? "" : "py-4"
      }`}>
        <div
          className={`transition-all duration-300 bg-white rounded-xl overflow-hidden relative ${
            isFullscreen ? "shadow-2xl" : "shadow-2xl"
          } ${state.previewDevice !== "desktop" ? "flex-shrink-0" : "w-full h-full"}`}
          style={getIframeContainerStyle()}
        >
          {/* Device Frame for mobile/tablet */}
          {state.previewDevice !== "desktop" && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span>{deviceConfig.description}</span>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/90 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-sm text-slate-500">Loading preview...</span>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src="/tenant-site/editor/preview"
            className="w-full border-0"
            style={getIframeStyle()}
            title="Website Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>

      {/* Empty State Overlay */}
      {currentBlocks.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`text-center p-8 rounded-2xl shadow-xl pointer-events-auto ${
            isFullscreen ? "bg-slate-800/90 text-white" : "bg-white/95"
          }`}>
            <div className="text-6xl mb-4">{isEditingPage ? "📄" : "🏠"}</div>
            <p className={`mb-4 ${isFullscreen ? "text-slate-300" : "text-slate-600"}`}>
              {isRTL
                ? isEditingPage 
                  ? "لا توجد كتل في هذه الصفحة بعد."
                  : "لا توجد أقسام بعد. أضف أقسامًا من الشريط الجانبي."
                : isEditingPage
                  ? "No blocks in this page yet. Add blocks from the sidebar."
                  : "No sections yet. Add sections from the sidebar."}
            </p>
            <button
              onClick={() => {
                addSection({
                  section_type: "hero",
                  content: {
                    variant: "centered",
                    title: { en: "Welcome", ar: "مرحبًا", ur: "خوش آمدید" },
                    subtitle: { en: "Your amazing website", ar: "موقعك الرائع", ur: "آپ کی شاندار ویب سائٹ" },
                  },
                });
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {isRTL 
                ? isEditingPage ? "إضافة كتلة" : "إضافة قسم Hero"
                : isEditingPage ? "Add Block" : "Add Hero Section"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}