"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import TenantLanguageSwitcher from "../utils/LanguageSwitcher";
/**
 * HEADER SECTION
 * Renders navigation with logo, links, and CTA button
 */
export default function Header({ data }) {
  const { lang } = useTenantLang();
  const isRTL = lang === "ar" || lang === "ur";

  const content = data?.content || data || {};
  const logo = content.logo || {};
  const navigation = content.nav_links || [];
  const ctaButton = content.cta_button;
  const background = content.style?.background || "white";
  const sticky = content.style?.sticky ?? true;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  const bgClass = {
    white: "bg-white border-b border-gray-200",
    dark: "bg-gray-900 text-white border-b border-gray-800",
    transparent: scrolled ? "bg-white/90 backdrop-blur-lg shadow-sm" : "bg-transparent",
  }[background];

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      className={`${sticky ? "sticky top-0" : ""} z-50 transition-all ${bgClass}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {logo.image_url ? (
            <img src={logo.image_url} className="h-9" alt="" />
          ) : (
            <span className="text-xl font-bold">
              {resolveTranslated(logo.text, lang)}
            </span>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navigation.map((item, i) => (
            <a
              key={i}
              href={item.url || "#"}
              className="font-medium hover:text-blue-600 transition-colors"
            >
              {resolveTranslated(item.label, lang)}
            </a>
          ))}
        </nav>

        {/* CTA Button */}
      <div className="hidden md:flex items-center gap-4">
        {ctaButton && (
          <a
            href={ctaButton.url || "#"}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            {resolveTranslated(ctaButton.text, lang)}
          </a>
        )}

        {/* Language Switcher */}
        <TenantLanguageSwitcher />
      </div>


        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 py-4 border-t border-gray-200 bg-white">
          {navigation.map((item, i) => (
            <a
              key={i}
              href={item.url || "#"}
              className="block py-3 font-medium"
            >
              {resolveTranslated(item.label, lang)}
            </a>
          ))}
          {ctaButton && (
            <a
              href={ctaButton.url || "#"}
              className="block mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl text-center font-semibold"
            >
              {resolveTranslated(ctaButton.text, lang)}
            </a>
          )}
        </div>
      )}
    </header>
  );
}
