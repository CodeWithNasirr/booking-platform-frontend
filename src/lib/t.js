import { useState, useEffect, useCallback } from "react";
import { translations } from "@/translations";
import Cookies from "js-cookie";

const RTL_LANGUAGES = ["ar", "ur", "he", "fa"];
const LANG_CHANGE_EVENT = "app-lang-change";

export function getLanguage() {
  if (typeof window === "undefined") return "en";
  return Cookies.get("app_language") || "en";
}

export function isRTL(lang) {
  const l = lang || getLanguage();
  return RTL_LANGUAGES.includes(l);
}

export function getDir(lang) {
  return isRTL(lang) ? "rtl" : "ltr";
}


export function setLanguage(lang) {
  Cookies.set("app_language", lang, { expires: 365 });

  document.documentElement.dir =
    RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";

  document.documentElement.lang = lang;

  window.dispatchEvent(
    new CustomEvent(LANG_CHANGE_EVENT, {
      detail: { lang },
    })
  );
}

// export function t(key, lang) {
//   if (!key) return "";
//   const l = lang || getLanguage();

//   if (typeof key === "object") {
//     return key[l] || key.en || Object.values(key)[0] || "";
//   }

//   return translations?.[l]?.[key] ?? translations?.en?.[key] ?? key;
// }

export function t(key, lang, params = {}) {
  if (!key) return "";

  const l = lang || getLanguage();

  let text = "";

  if (typeof key === "object") {
    text = key[l] || key.en || Object.values(key)[0] || "";
  } else {
    text =
      translations?.[l]?.[key] ??
      translations?.en?.[key] ??
      key;
  }

  // Replace placeholders
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(
      new RegExp(`{{\\s*${param}\\s*}}`, "g"),
      String(value)
    );
  });

  return text;
}

/**
 * useTranslation()
 *
 * Hydration-safe translation hook.
 *
 * - First render always uses "en" to match the server HTML
 * - After mount, switches to the real cookie language
 * - Re-renders automatically when setLanguage() is called anywhere
 *
 * Usage:
 *   const { t, lang, isRTL, dir } = useTranslation();
 */
export function useTranslation() {
  const [lang, setLang] = useState("en"); // "en" matches server render

  useEffect(() => {
    // Sync to real language after hydration
    const actual = getLanguage();
    setLang(actual);

    function onLangChange(e) {
      const newLang = e.detail.lang;
      setLang(newLang);

      // Apply RTL direction immediately to the document
      // This covers components not inside AppProvider
      if (typeof document !== "undefined") {
        document.documentElement.dir = RTL_LANGUAGES.includes(newLang)
          ? "rtl"
          : "ltr";
        document.documentElement.lang = newLang;
      }
    }

    window.addEventListener(LANG_CHANGE_EVENT, onLangChange);
    return () => window.removeEventListener(LANG_CHANGE_EVENT, onLangChange);
  }, []);

  // const tFn = useCallback((key) => t(key, lang), [lang]);
  const tFn = useCallback(
      (key, params = {}) => t(key, lang, params),
      [lang]
    );

  const rtl = RTL_LANGUAGES.includes(lang);

  return {
    t: tFn,
    lang,
    isRTL: rtl,
    dir: rtl ? "rtl" : "ltr",
    setLanguage,
  };
}