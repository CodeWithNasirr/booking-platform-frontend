"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

/**
 * ============================================================================
 * TENANT LANGUAGE CONTEXT
 * ============================================================================
 * 
 * Provides language state for tenant sites with:
 *   - Persistent language via cookies
 *   - RTL support for Arabic and Urdu
 *   - Document direction handling
 * 
 * ============================================================================
 */

export const TenantLangContext = createContext({
  lang: "en",
  setLang: () => {},
});

export function TenantLangProvider({ children, defaultLang = "en" }) {
  const [lang, setLang] = useState(defaultLang);

  // Initialize from cookie on mount
  useEffect(() => {
    const saved = Cookies.get("tenant_lang") || defaultLang;
    setLang(saved);
    applyDirection(saved);
  }, [defaultLang]);

  // Update direction when lang changes
  const updateLang = (value) => {
    setLang(value);
    Cookies.set("tenant_lang", value, { expires: 30 });
    applyDirection(value);
  };

  return (
    <TenantLangContext.Provider value={{ lang, setLang: updateLang }}>
      {children}
    </TenantLangContext.Provider>
  );
}

export function useTenantLang() {
  return useContext(TenantLangContext);
}

// Helper to set document direction
function applyDirection(lang) {
  if (typeof document !== "undefined") {
    const isRTL = lang === "ar" || lang === "ur";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }
}
