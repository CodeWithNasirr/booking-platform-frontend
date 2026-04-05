"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

export const TenantLangContext = createContext({
  lang: "en",
  setLang: () => {},
});

export function TenantLangProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = Cookies.get("tenant_lang") || "en";
    setLang(saved);
    document.documentElement.dir = saved === "ar" || saved === "ur" ? "rtl" : "ltr";
  }, []);

  const updateLang = (value) => {
    setLang(value);
    Cookies.set("tenant_lang", value, { expires: 30 });

    document.documentElement.dir = value === "ar" || value === "ur" ? "rtl" : "ltr";
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
