"use client";

/**
 * BuilderContext.js
 * 
 * Complete state management for the website builder.
 * Handles sections, theme, pages, and all editor state.
 * 
 * UPDATED: Added editing mode to switch between layout (home) and page editing
 */
import { v4 as uuidv4 } from "uuid";
import { createContext, useContext, useReducer, useCallback, useMemo } from "react";
// const uuidv4 = () => crypto.randomUUID();

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  // Core data - Main layout (Home page)
  sections: [],
  
  // Pages - Each has its own content_blocks
  pages: [],
  
  // Theme configuration
  themeConfig: {
    colors: {
      primary: "#7C3AED",
      secondary: "#5B21B6",
      accent: "#A78BFA",
      background: "#FFFFFF",
      background_soft: "#FAF5FF",
      text: "#1F2937",
      text_muted: "#6B7280",
      border: "#E5E7EB",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
    },
    fonts: {
      base: "Inter, system-ui, sans-serif",
      heading: "Plus Jakarta Sans, system-ui, sans-serif",
    },
    radius: "8px",
    shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
  
  // Site configuration
  siteConfig: {
    business_name: "",
    subdomain: "",
    default_language: "en",
    supported_languages: ["en", "ar", "ur"],
    seo_title: "",
    seo_description: "",
  },

  // Template info
  selectedTemplate: null,
  selectedLayout: null,

  // ============================================================
  // EDITING MODE - NEW
  // ============================================================
  // 'layout' = editing main homepage sections
  // 'page' = editing a specific page's content_blocks
  editingMode: "layout",
  editingPageId: null, // ID of page being edited (when mode is 'page')

  // UI State
  activeSection: null,
  activeSectionIndex: null,
  sidebarTab: "sections", // sections | pages | theme | settings
  previewMode: false,
  previewDevice: "desktop", // desktop | tablet | mobile

  // Save state
  isDirty: false,
  isSaving: false,
  lastSaved: null,
};

// ============================================================
// ACTION TYPES
// ============================================================

const ActionTypes = {
  // Sections (for main layout)
  SET_SECTIONS: "SET_SECTIONS",
  ADD_SECTION: "ADD_SECTION",
  UPDATE_SECTION: "UPDATE_SECTION",
  REMOVE_SECTION: "REMOVE_SECTION",
  DUPLICATE_SECTION: "DUPLICATE_SECTION",
  MOVE_SECTION: "MOVE_SECTION",
  REORDER_SECTIONS: "REORDER_SECTIONS",

  // Active section
  SET_ACTIVE_SECTION: "SET_ACTIVE_SECTION",
  CLEAR_ACTIVE_SECTION: "CLEAR_ACTIVE_SECTION",

  // Pages
  SET_PAGES: "SET_PAGES",
  ADD_PAGE: "ADD_PAGE",
  UPDATE_PAGE: "UPDATE_PAGE",
  DELETE_PAGE: "DELETE_PAGE",
  
  // Page content blocks (when editing a page)
  ADD_PAGE_BLOCK: "ADD_PAGE_BLOCK",
  UPDATE_PAGE_BLOCK: "UPDATE_PAGE_BLOCK",
  REMOVE_PAGE_BLOCK: "REMOVE_PAGE_BLOCK",
  DUPLICATE_PAGE_BLOCK: "DUPLICATE_PAGE_BLOCK",
  MOVE_PAGE_BLOCK: "MOVE_PAGE_BLOCK",

  // Editing mode
  SET_EDITING_MODE: "SET_EDITING_MODE",
  EDIT_HOME_PAGE: "EDIT_HOME_PAGE",
  EDIT_PAGE: "EDIT_PAGE",

  // Theme
  SET_THEME_CONFIG: "SET_THEME_CONFIG",
  SET_THEME_COLOR: "SET_THEME_COLOR",
  SET_THEME_FONT: "SET_THEME_FONT",
  SET_THEME_RADIUS: "SET_THEME_RADIUS",

  // Site config
  SET_SITE_CONFIG: "SET_SITE_CONFIG",
  UPDATE_SITE_CONFIG: "UPDATE_SITE_CONFIG",

  // Template
  SET_TEMPLATE: "SET_TEMPLATE",
  SET_LAYOUT: "SET_LAYOUT",

  // UI State
  SET_SIDEBAR_TAB: "SET_SIDEBAR_TAB",
  SET_PREVIEW_MODE: "SET_PREVIEW_MODE",
  SET_PREVIEW_DEVICE: "SET_PREVIEW_DEVICE",

  // Save state
  SET_SAVING: "SET_SAVING",
  SET_SAVED: "SET_SAVED",
  SET_DIRTY: "SET_DIRTY",

  // Bulk load
  LOAD_STATE: "LOAD_STATE",
  RESET_STATE: "RESET_STATE",
};

// ============================================================
// HELPER: Get current editing target
// ============================================================

function getCurrentBlocks(state) {
  if (state.editingMode === "layout") {
    return state.sections;
  }
  const page = state.pages.find(p => p.id === state.editingPageId);
  return page?.content_blocks || [];
}

// ============================================================
// REDUCER
// ============================================================

function builderReducer(state, action) {
  switch (action.type) {
    // ========================
    // MAIN LAYOUT SECTIONS
    // ========================
    case ActionTypes.SET_SECTIONS:
      return {
        ...state,
        sections: action.payload.map((s, i) => ({
          ...s,
          id: s.id || uuidv4(),
          order: i + 1,
        })),
        isDirty: true,
      };

    case ActionTypes.ADD_SECTION: {
      // If editing a page, add to page's content_blocks instead
      if (state.editingMode === "page" && state.editingPageId) {
        const newBlock = {
          ...action.payload,
          id: action.payload.id || uuidv4(),
        };
        return {
          ...state,
          pages: state.pages.map(p => 
            p.id === state.editingPageId
              ? { 
                  ...p, 
                  content_blocks: [...(p.content_blocks || []), newBlock].map((b, i) => ({ ...b, order: i + 1 }))
                }
              : p
          ),
          isDirty: true,
        };
      }
      
      // Otherwise add to main layout
      const newSection = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
        order: state.sections.length + 1,
      };
      return {
        ...state,
        sections: [...state.sections, newSection],
        isDirty: true,
      };
    }

    case ActionTypes.UPDATE_SECTION: {
      const { index, updates } = action.payload;
      
      // If editing a page, update page's content_blocks
      if (state.editingMode === "page" && state.editingPageId) {
        return {
          ...state,
          pages: state.pages.map(p => {
            if (p.id !== state.editingPageId) return p;
            const blocks = [...(p.content_blocks || [])];
            if (blocks[index]) {
              blocks[index] = {
                ...blocks[index],
                content: { ...blocks[index].content, ...updates },
              };
            }
            return { ...p, content_blocks: blocks };
          }),
          activeSection: state.activeSectionIndex === index 
            ? { ...state.activeSection, content: { ...state.activeSection?.content, ...updates } }
            : state.activeSection,
          isDirty: true,
        };
      }
      
      // Otherwise update main layout
      const sections = [...state.sections];
      if (sections[index]) {
        sections[index] = {
          ...sections[index],
          content: { ...sections[index].content, ...updates },
        };
      }
      return {
        ...state,
        sections,
        activeSection: state.activeSectionIndex === index ? sections[index] : state.activeSection,
        isDirty: true,
      };
    }

    case ActionTypes.REMOVE_SECTION: {
      // If editing a page, remove from page's content_blocks
      if (state.editingMode === "page" && state.editingPageId) {
        return {
          ...state,
          pages: state.pages.map(p => {
            if (p.id !== state.editingPageId) return p;
            const blocks = (p.content_blocks || []).filter((_, i) => i !== action.payload);
            return { ...p, content_blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })) };
          }),
          activeSection: state.activeSectionIndex === action.payload ? null : state.activeSection,
          activeSectionIndex: state.activeSectionIndex === action.payload ? null : state.activeSectionIndex,
          isDirty: true,
        };
      }
      
      // Otherwise remove from main layout
      const sections = state.sections.filter((_, i) => i !== action.payload);
      return {
        ...state,
        sections: sections.map((s, i) => ({ ...s, order: i + 1 })),
        activeSection: state.activeSectionIndex === action.payload ? null : state.activeSection,
        activeSectionIndex: state.activeSectionIndex === action.payload ? null : state.activeSectionIndex,
        isDirty: true,
      };
    }

    case ActionTypes.DUPLICATE_SECTION: {
      // If editing a page, duplicate in page's content_blocks
      if (state.editingMode === "page" && state.editingPageId) {
        return {
          ...state,
          pages: state.pages.map(p => {
            if (p.id !== state.editingPageId) return p;
            const blocks = [...(p.content_blocks || [])];
            const blockToDuplicate = blocks[action.payload];
            if (!blockToDuplicate) return p;
            
            const duplicated = {
              ...JSON.parse(JSON.stringify(blockToDuplicate)),
              id: uuidv4(),
            };
            
            const newBlocks = [
              ...blocks.slice(0, action.payload + 1),
              duplicated,
              ...blocks.slice(action.payload + 1),
            ].map((b, i) => ({ ...b, order: i + 1 }));
            
            return { ...p, content_blocks: newBlocks };
          }),
          isDirty: true,
        };
      }
      
      // Otherwise duplicate in main layout
      const sectionToDuplicate = state.sections[action.payload];
      if (!sectionToDuplicate) return state;

      const duplicated = {
        ...JSON.parse(JSON.stringify(sectionToDuplicate)),
        id: uuidv4(),
      };

      const sections = [
        ...state.sections.slice(0, action.payload + 1),
        duplicated,
        ...state.sections.slice(action.payload + 1),
      ].map((s, i) => ({ ...s, order: i + 1 }));

      return {
        ...state,
        sections,
        isDirty: true,
      };
    }

    case ActionTypes.MOVE_SECTION: {
      const { fromIndex, toIndex } = action.payload;
      
      // If editing a page, move in page's content_blocks
      if (state.editingMode === "page" && state.editingPageId) {
        return {
          ...state,
          pages: state.pages.map(p => {
            if (p.id !== state.editingPageId) return p;
            const blocks = [...(p.content_blocks || [])];
            const [removed] = blocks.splice(fromIndex, 1);
            blocks.splice(toIndex, 0, removed);
            return { ...p, content_blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })) };
          }),
          isDirty: true,
        };
      }
      
      // Otherwise move in main layout
      const sections = [...state.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);

      return {
        ...state,
        sections: sections.map((s, i) => ({ ...s, order: i + 1 })),
        isDirty: true,
      };
    }

    case ActionTypes.REORDER_SECTIONS:
      return {
        ...state,
        sections: action.payload.map((s, i) => ({ ...s, order: i + 1 })),
        isDirty: true,
      };

    // ========================
    // ACTIVE SECTION
    // ========================
    case ActionTypes.SET_ACTIVE_SECTION:
      return {
        ...state,
        activeSection: action.payload.section,
        activeSectionIndex: action.payload.index,
      };

    case ActionTypes.CLEAR_ACTIVE_SECTION:
      return {
        ...state,
        activeSection: null,
        activeSectionIndex: null,
      };

    // ========================
    // EDITING MODE
    // ========================
    case ActionTypes.EDIT_HOME_PAGE:
      return {
        ...state,
        editingMode: "layout",
        editingPageId: null,
        activeSection: null,
        activeSectionIndex: null,
        sidebarTab: "sections",
      };

    case ActionTypes.EDIT_PAGE: {
      const pageId = action.payload;
      const page = state.pages.find(p => p.id === pageId);
      if (!page) return state;
      
      return {
        ...state,
        editingMode: "page",
        editingPageId: pageId,
        activeSection: null,
        activeSectionIndex: null,
        sidebarTab: "sections",
      };
    }

    // ========================
    // PAGES
    // ========================
    case ActionTypes.SET_PAGES:
      return {
        ...state,
        pages: action.payload,
        isDirty: true,
      };

    case ActionTypes.ADD_PAGE: {
      const newPage = {
        id: uuidv4(),
        slug: action.payload.slug || "new-page",
        title: action.payload.title || { en: "New Page", ar: "صفحة جديدة", ur: "نیا صفحہ" },
        content_blocks: action.payload.content_blocks || [],
        is_published: true,
        seo_title: "",
        seo_description: "",
        ...action.payload,
      };
      return {
        ...state,
        pages: [...state.pages, newPage],
        isDirty: true,
      };
    }

    case ActionTypes.UPDATE_PAGE: {
      const { pageId, updates } = action.payload;
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === pageId ? { ...p, ...updates } : p
        ),
        isDirty: true,
      };
    }

    case ActionTypes.DELETE_PAGE: {
      const deletedPageId = action.payload;
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== deletedPageId),
        // If deleting the page we're editing, go back to home
        editingMode: state.editingPageId === deletedPageId ? "layout" : state.editingMode,
        editingPageId: state.editingPageId === deletedPageId ? null : state.editingPageId,
        isDirty: true,
      };
    }

    // ========================
    // THEME
    // ========================
    case ActionTypes.SET_THEME_CONFIG:
      return {
        ...state,
        themeConfig: { ...state.themeConfig, ...action.payload },
        isDirty: true,
      };

    case ActionTypes.SET_THEME_COLOR:
      return {
        ...state,
        themeConfig: {
          ...state.themeConfig,
          colors: { ...state.themeConfig.colors, [action.payload.key]: action.payload.value },
        },
        isDirty: true,
      };

    case ActionTypes.SET_THEME_FONT:
      return {
        ...state,
        themeConfig: {
          ...state.themeConfig,
          fonts: { ...state.themeConfig.fonts, [action.payload.key]: action.payload.value },
        },
        isDirty: true,
      };

    case ActionTypes.SET_THEME_RADIUS:
      return {
        ...state,
        themeConfig: { ...state.themeConfig, radius: action.payload },
        isDirty: true,
      };

    // ========================
    // SITE CONFIG
    // ========================
    case ActionTypes.SET_SITE_CONFIG:
      return {
        ...state,
        siteConfig: action.payload,
        isDirty: true,
      };

    case ActionTypes.UPDATE_SITE_CONFIG:
      return {
        ...state,
        siteConfig: { ...state.siteConfig, ...action.payload },
        isDirty: true,
      };

    // ========================
    // TEMPLATE
    // ========================
    case ActionTypes.SET_TEMPLATE:
      return {
        ...state,
        selectedTemplate: action.payload,
        isDirty: true,
      };

    case ActionTypes.SET_LAYOUT:
      return {
        ...state,
        selectedLayout: action.payload,
        isDirty: true,
      };

    // ========================
    // UI STATE
    // ========================
    case ActionTypes.SET_SIDEBAR_TAB:
      return {
        ...state,
        sidebarTab: action.payload,
      };

    case ActionTypes.SET_PREVIEW_MODE:
      return {
        ...state,
        previewMode: action.payload,
        activeSection: action.payload ? null : state.activeSection,
        activeSectionIndex: action.payload ? null : state.activeSectionIndex,
      };

    case ActionTypes.SET_PREVIEW_DEVICE:
      return {
        ...state,
        previewDevice: action.payload,
      };

    // ========================
    // SAVE STATE
    // ========================
    case ActionTypes.SET_SAVING:
      return {
        ...state,
        isSaving: true,
      };

    case ActionTypes.SET_SAVED:
      return {
        ...state,
        isSaving: false,
        isDirty: false,
        lastSaved: new Date().toISOString(),
      };

    case ActionTypes.SET_DIRTY:
      return {
        ...state,
        isDirty: action.payload,
      };

    // ========================
    // BULK OPERATIONS
    // ========================
    case ActionTypes.LOAD_STATE:
      return {
        ...state,
        ...action.payload,
        sections: (action.payload.sections || []).map((s, i) => ({
          ...s,
          id: s.id || uuidv4(),
          order: i + 1,
        })),
        editingMode: "layout",
        editingPageId: null,
        isDirty: false,
      };

    case ActionTypes.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

const BuilderContext = createContext(null);

export function BuilderProvider({ children }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  // ========================
  // COMPUTED VALUES
  // ========================
  
  // Get the current blocks being edited (either layout sections or page content_blocks)
  const currentBlocks = useMemo(() => {
    if (state.editingMode === "layout") {
      return state.sections;
    }
    const page = state.pages.find(p => p.id === state.editingPageId);
    return page?.content_blocks || [];
  }, [state.editingMode, state.editingPageId, state.sections, state.pages]);

  // Get the current page being edited (if any)
  const currentEditingPage = useMemo(() => {
    if (state.editingMode === "page" && state.editingPageId) {
      return state.pages.find(p => p.id === state.editingPageId) || null;
    }
    return null;
  }, [state.editingMode, state.editingPageId, state.pages]);

  // ========================
  // SECTION ACTIONS (work on current target)
  // ========================
  const setSections = useCallback((sections) => {
    dispatch({ type: ActionTypes.SET_SECTIONS, payload: sections });
  }, []);

  const addSection = useCallback((section) => {
    dispatch({ type: ActionTypes.ADD_SECTION, payload: section });
  }, []);

  const updateSection = useCallback((index, updates) => {
    dispatch({ type: ActionTypes.UPDATE_SECTION, payload: { index, updates } });
  }, []);

  const removeSection = useCallback((index) => {
    dispatch({ type: ActionTypes.REMOVE_SECTION, payload: index });
  }, []);

  const duplicateSection = useCallback((index) => {
    dispatch({ type: ActionTypes.DUPLICATE_SECTION, payload: index });
  }, []);

  const moveSection = useCallback((fromIndex, toIndex) => {
    dispatch({ type: ActionTypes.MOVE_SECTION, payload: { fromIndex, toIndex } });
  }, []);

  const setActiveSection = useCallback((section, index) => {
    dispatch({ type: ActionTypes.SET_ACTIVE_SECTION, payload: { section, index } });
  }, []);

  const clearActiveSection = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ACTIVE_SECTION });
  }, []);

  // ========================
  // EDITING MODE ACTIONS
  // ========================
  const editHomePage = useCallback(() => {
    dispatch({ type: ActionTypes.EDIT_HOME_PAGE });
  }, []);

  const editPage = useCallback((pageId) => {
    dispatch({ type: ActionTypes.EDIT_PAGE, payload: pageId });
  }, []);

  // ========================
  // PAGE ACTIONS
  // ========================
  const setPages = useCallback((pages) => {
    dispatch({ type: ActionTypes.SET_PAGES, payload: pages });
  }, []);

  const addPage = useCallback((page) => {
    dispatch({ type: ActionTypes.ADD_PAGE, payload: page });
  }, []);

  const updatePage = useCallback((pageId, updates) => {
    dispatch({ type: ActionTypes.UPDATE_PAGE, payload: { pageId, updates } });
  }, []);

  const deletePage = useCallback((pageId) => {
    dispatch({ type: ActionTypes.DELETE_PAGE, payload: pageId });
  }, []);

  // ========================
  // THEME ACTIONS
  // ========================
  const setThemeConfig = useCallback((config) => {
    dispatch({ type: ActionTypes.SET_THEME_CONFIG, payload: config });
  }, []);

  const setThemeColor = useCallback((key, value) => {
    dispatch({ type: ActionTypes.SET_THEME_COLOR, payload: { key, value } });
  }, []);

  const setThemeFont = useCallback((key, value) => {
    dispatch({ type: ActionTypes.SET_THEME_FONT, payload: { key, value } });
  }, []);

  const setThemeRadius = useCallback((value) => {
    dispatch({ type: ActionTypes.SET_THEME_RADIUS, payload: value });
  }, []);

  // ========================
  // SITE CONFIG ACTIONS
  // ========================
  const setSiteConfig = useCallback((config) => {
    dispatch({ type: ActionTypes.SET_SITE_CONFIG, payload: config });
  }, []);

  const updateSiteConfig = useCallback((updates) => {
    dispatch({ type: ActionTypes.UPDATE_SITE_CONFIG, payload: updates });
  }, []);

  // ========================
  // TEMPLATE ACTIONS
  // ========================
  const setTemplate = useCallback((template) => {
    dispatch({ type: ActionTypes.SET_TEMPLATE, payload: template });
  }, []);

  const setLayout = useCallback((layout) => {
    dispatch({ type: ActionTypes.SET_LAYOUT, payload: layout });
  }, []);

  // ========================
  // UI ACTIONS
  // ========================
  const setSidebarTab = useCallback((tab) => {
    dispatch({ type: ActionTypes.SET_SIDEBAR_TAB, payload: tab });
  }, []);

  const setPreviewMode = useCallback((enabled) => {
    dispatch({ type: ActionTypes.SET_PREVIEW_MODE, payload: enabled });
  }, []);

  const setPreviewDevice = useCallback((device) => {
    dispatch({ type: ActionTypes.SET_PREVIEW_DEVICE, payload: device });
  }, []);

  // ========================
  // SAVE ACTIONS
  // ========================
  const setSaving = useCallback(() => {
    dispatch({ type: ActionTypes.SET_SAVING });
  }, []);

  const setSaved = useCallback(() => {
    dispatch({ type: ActionTypes.SET_SAVED });
  }, []);

  const setDirty = useCallback((dirty) => {
    dispatch({ type: ActionTypes.SET_DIRTY, payload: dirty });
  }, []);

  // ========================
  // BULK ACTIONS
  // ========================
  const loadState = useCallback((newState) => {
    dispatch({ type: ActionTypes.LOAD_STATE, payload: newState });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_STATE });
  }, []);

  const value = {
    state,
    // Computed
    currentBlocks,
    currentEditingPage,
    // Sections
    setSections,
    addSection,
    updateSection,
    removeSection,
    duplicateSection,
    moveSection,
    setActiveSection,
    clearActiveSection,
    // Editing mode
    editHomePage,
    editPage,
    // Pages
    setPages,
    addPage,
    updatePage,
    deletePage,
    // Theme
    setThemeConfig,
    setThemeColor,
    setThemeFont,
    setThemeRadius,
    // Site config
    setSiteConfig,
    updateSiteConfig,
    // Template
    setTemplate,
    setLayout,
    // UI
    setSidebarTab,
    setPreviewMode,
    setPreviewDevice,
    // Save
    setSaving,
    setSaved,
    setDirty,
    // Bulk
    loadState,
    resetState,
  };

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
}

export default BuilderContext;