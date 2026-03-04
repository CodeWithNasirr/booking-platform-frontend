"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { useLayoutEffect } from "react";
const TenantLangContext = createContext(undefined);

export function useTenantLang() {
  const ctx = useContext(TenantLangContext);
  if (!ctx) {
    throw new Error("useTenantLang must be used within TenantLangProvider");
  }
  return ctx;
}

export function TenantLangProvider({
  defaultLang = "en",
  supportedLanguages = ["en", "ar", "ur"],
  children,
}) {
  const [language, setLanguageState] = useState(defaultLang);
  const [hydrated, setHydrated] = useState(false);

  // 🔥 EXACT SAME RTL LOGIC AS AppProvider
  const isRTL = language === "ar" || language === "ur";

  // ------------------------------
  // HYDRATION (FROM COOKIE)
  // ------------------------------
  useEffect(() => {
    const savedLang = Cookies.get("tenant_lang");

    if (savedLang && supportedLanguages.includes(savedLang)) {
      setLanguageState(savedLang);
    }

    setHydrated(true);
  }, [supportedLanguages]);

  // ------------------------------
  // SYNC HTML + COOKIE
  // ------------------------------
  useLayoutEffect(() => {
    if (!hydrated) return;
    Cookies.set("tenant_lang", language, { expires: 365 });
  }, [hydrated, language]);


  // ------------------------------
  // CHANGE LANGUAGE
  // ------------------------------
  const setLanguage = useCallback(
    (lang) => {
      if (!supportedLanguages.includes(lang)) return;
      setLanguageState(lang);
    },
    [supportedLanguages]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isRTL,
      supportedLanguages,
      hydrated,
    }),
    [language, setLanguage, isRTL, supportedLanguages, hydrated]
  );

  return (
    <TenantLangContext.Provider value={value}>
      {children}
    </TenantLangContext.Provider>
  );
}

export default TenantLangProvider;
