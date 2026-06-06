"use client";

import React, {
  createContext,
  useContext,
  useState,
} from "react";

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {

  const [language, setLanguage] = useState("en");

  const translations = {
    en: {},
    ar: {},
    ur: {},
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <TranslationContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {

  const ctx = useContext(TranslationContext);

  if (!ctx) {
    throw new Error(
      "useTranslation must be used inside TranslationProvider"
    );
  }

  return ctx;
}