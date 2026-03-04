"use client";

import { createContext, useContext } from "react";

const LangContext = createContext("en");

export function useLang() {
  return useContext(LangContext);
}

export default function TenantLayout({ children }) {
  // Later: fetch lang from tenant settings
  const lang = "en"; // or ar / ur

  return (
    <LangContext.Provider value={lang}>
      <html dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"}>
        <body>{children}</body>
      </html>
    </LangContext.Provider>
  );
}
