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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-2 h-11 sm:h-10 px-3 rounded-xl bg-surface text-foreground border border-border hover:border-ring hover:shadow-sm transition-all"
      >
        <Globe className="w-4 h-4 text-primary" />

        <span className="text-sm hidden sm:inline">
          {currentLanguage.label}
        </span>
      </button>

      <div
        role="listbox"
        className={`
          absolute top-full mt-2
          min-w-[180px]
          bg-popover text-popover-foreground
          rounded-xl
          border border-border
          shadow-lg
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
            role="option"
            aria-selected={currentLang === lang.code}
            className={`
              w-full
              flex items-center gap-3
              px-4 py-3
              text-sm
              transition-colors
              hover:bg-muted

              ${
                isRTL
                  ? "flex-row-reverse text-right justify-end"
                  : "text-left"
              }

              ${
                currentLang === lang.code
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground"
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