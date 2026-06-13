"use client";

import { Globe } from "lucide-react";
import { setLanguage, getLanguage } from "@/lib/t";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/t";

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState("en");
  const [open, setOpen] = useState(false);
  const { isRTL } = useTranslation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    setCurrentLang(getLanguage());

    function onLangChange(e) {
      setCurrentLang(e.detail.lang);
    }

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("app-lang-change", onLangChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("app-lang-change", onLangChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleChange(newLang) {
    setLanguage(newLang);
    setOpen(false);
  }

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "ur", label: "اردو", flag: "🇵🇰" },
  ];

  const currentLanguage =
    languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div
      ref={dropdownRef}
      className="relative shrink-0 overflow-visible"
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex items-center gap-2
          px-3 py-2
          rounded-xl
          bg-white
          border border-gray-200
          hover:border-blue-300
          hover:shadow-sm
          transition-all
          ${isRTL ? "flex-row-reverse" : ""}
        `}
      >
        <Globe className="w-4 h-4 text-blue-600" />

        <span className="text-sm hidden sm:inline">
          {currentLanguage.label}
        </span>
      </button>

      <div
        className={`
          absolute top-full mt-2
          min-w-[180px]
          bg-white
          rounded-xl
          border border-gray-200
          shadow-xl
          z-[9999]
          overflow-hidden
          transition-all duration-200

          ${
            open
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible -translate-y-1"
          }

          ${isRTL ? "right-0" : "left-0"}
        `}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`
              w-full
              flex items-center gap-3
              px-4 py-3
              text-sm
              transition-colors
              hover:bg-gray-50

              ${
                isRTL
                  ? "flex-row-reverse text-right justify-end"
                  : "text-left"
              }

              ${
                currentLang === lang.code
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700"
              }
            `}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}