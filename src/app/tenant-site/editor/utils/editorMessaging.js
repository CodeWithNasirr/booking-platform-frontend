/**
 * editorMessaging.js
 * 
 * Shared message types and utilities for parent-iframe communication
 * in the website builder editor.
 */

// ============================================================
// MESSAGE TYPES
// ============================================================

export const MESSAGE_TYPES = {
  // Parent → Iframe
  UPDATE_SECTIONS: "UPDATE_SECTIONS",
  UPDATE_THEME: "UPDATE_THEME",
  SET_LANGUAGE: "SET_LANGUAGE",
  SELECT_SECTION: "SELECT_SECTION",
  HIGHLIGHT_SECTION: "HIGHLIGHT_SECTION",
  SET_PREVIEW_MODE: "SET_PREVIEW_MODE",
  SET_EDIT_MODE: "SET_EDIT_MODE",
  SCROLL_TO_SECTION: "SCROLL_TO_SECTION",
  
  // Iframe → Parent
  SECTION_CLICKED: "SECTION_CLICKED",
  SECTION_HOVERED: "SECTION_HOVERED",
  IFRAME_READY: "IFRAME_READY",
  IFRAME_HEIGHT: "IFRAME_HEIGHT",
  REQUEST_INITIAL_STATE: "REQUEST_INITIAL_STATE",
};

// ============================================================
// MESSAGE CREATORS
// ============================================================

/**
 * Creates a message object for postMessage communication
 */
export function createMessage(type, payload = {}) {
  return {
    source: "website-builder",
    type,
    payload,
    timestamp: Date.now(),
  };
}

// Parent → Iframe Messages

export function createUpdateSectionsMessage(sections) {
  return createMessage(MESSAGE_TYPES.UPDATE_SECTIONS, { sections });
}

export function createUpdateThemeMessage(theme) {
  return createMessage(MESSAGE_TYPES.UPDATE_THEME, { theme });
}

export function createSetLanguageMessage(language) {
  return createMessage(MESSAGE_TYPES.SET_LANGUAGE, { language });
}

export function createSelectSectionMessage(index) {
  return createMessage(MESSAGE_TYPES.SELECT_SECTION, { index });
}

export function createHighlightSectionMessage(index) {
  return createMessage(MESSAGE_TYPES.HIGHLIGHT_SECTION, { index });
}

export function createSetPreviewModeMessage(enabled) {
  return createMessage(MESSAGE_TYPES.SET_PREVIEW_MODE, { enabled });
}

export function createScrollToSectionMessage(index) {
  return createMessage(MESSAGE_TYPES.SCROLL_TO_SECTION, { index });
}

// Iframe → Parent Messages

export function createSectionClickedMessage(index, section) {
  return createMessage(MESSAGE_TYPES.SECTION_CLICKED, { index, section });
}

export function createSectionHoveredMessage(index) {
  return createMessage(MESSAGE_TYPES.SECTION_HOVERED, { index });
}

export function createIframeReadyMessage() {
  return createMessage(MESSAGE_TYPES.IFRAME_READY, {});
}

export function createIframeHeightMessage(height) {
  return createMessage(MESSAGE_TYPES.IFRAME_HEIGHT, { height });
}

// ============================================================
// MESSAGE VALIDATION
// ============================================================

/**
 * Validates if a message is from our builder system
 */
export function isBuilderMessage(event) {
  return event.data?.source === "website-builder";
}

/**
 * Gets message type from event
 */
export function getMessageType(event) {
  if (!isBuilderMessage(event)) return null;
  return event.data.type;
}

/**
 * Gets message payload from event
 */
export function getMessagePayload(event) {
  if (!isBuilderMessage(event)) return null;
  return event.data.payload;
}

// ============================================================
// HOOKS FOR MESSAGE HANDLING
// ============================================================

import { useEffect, useCallback, useRef } from "react";

/**
 * Hook for sending messages to iframe
 */
export function useIframeMessenger(iframeRef) {
  const sendMessage = useCallback((message) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, "*");
    }
  }, [iframeRef]);

  return {
    sendSections: (sections) => sendMessage(createUpdateSectionsMessage(sections)),
    sendTheme: (theme) => sendMessage(createUpdateThemeMessage(theme)),
    sendLanguage: (language) => sendMessage(createSetLanguageMessage(language)),
    selectSection: (index) => sendMessage(createSelectSectionMessage(index)),
    highlightSection: (index) => sendMessage(createHighlightSectionMessage(index)),
    setPreviewMode: (enabled) => sendMessage(createSetPreviewModeMessage(enabled)),
    scrollToSection: (index) => sendMessage(createScrollToSectionMessage(index)),
    sendMessage,
  };
}

/**
 * Hook for receiving messages from parent (used in iframe)
 */
export function useParentMessages(handlers) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (!isBuilderMessage(event)) return;
      
      const { type, payload } = event.data;
      const handler = handlers[type];
      
      if (handler) {
        handler(payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handlers]);
}

/**
 * Hook for receiving messages from iframe (used in parent)
 */
export function useIframeMessages(handlers) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (!isBuilderMessage(event)) return;
      
      const { type, payload } = event.data;
      const handler = handlers[type];
      
      if (handler) {
        handler(payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handlers]);
}

// ============================================================
// STORAGE UTILITIES FOR INITIAL STATE
// ============================================================

const STORAGE_KEY = "builder_preview_state";

/**
 * Stores builder state for iframe to access
 */
export function storePreviewState(state) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      sections: state.sections,
      theme: state.themeConfig,
      language: state.language || "en",
      previewMode: state.previewMode || false,
      selectedIndex: state.activeSectionIndex,
      timestamp: Date.now(),
      domain: state.domain || null,
    }));
  } catch (err) {
    console.error("Failed to store preview state:", err);
  }
}

/**
 * Retrieves builder state in iframe
 */
export function retrievePreviewState() {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state = JSON.parse(stored);
    
    // Check if state is recent (within 5 minutes)
    if (Date.now() - state.timestamp > 5 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return state;
  } catch (err) {
    console.error("Failed to retrieve preview state:", err);
    return null;
  }
}

/**
 * Clears stored preview state
 */
export function clearPreviewState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}