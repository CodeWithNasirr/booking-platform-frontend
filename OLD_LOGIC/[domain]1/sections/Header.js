"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Header({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  // Use prop lang or context lang
  const lang = propLang || language;

  const {
    variant = "default",
    logo_url,
    logo_text,
    navigation = [],
    cta_button,
    cta_url = "#",
    show_announcement = false,
    announcement_text,
    announcement_link,
    background = "white",
    sticky = true,
    nav_style = "horizontal",
  } = data || {};

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Resolve translations
  const resolvedLogoText = resolveTranslated(logo_text, lang) || theme.business_name || "Logo";
  const resolvedCtaButton = resolveTranslated(cta_button, lang);
  const resolvedAnnouncement = resolveTranslated(announcement_text, lang);
  const resolvedNavigation = resolveTranslatedArray(navigation, lang, ["label"]);

  // Scroll effect
  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sticky]);

  // Background classes
  const baseHeaderClasses = `
    transition-all duration-300 
    ${sticky ? "sticky top-0 z-50" : ""} 
  `;

  const premiumBackground = {
    white: "bg-white border-b border-gray-200",
    dark: "bg-gray-900 border-b border-gray-800 text-white",
    transparent: scrolled
      ? "backdrop-blur-xl bg-white/70 shadow-sm"
      : "bg-transparent",
  }[background];

  // Use theme primary color for CTA
  const ctaStyle = {
    backgroundColor: theme.primary_color || "#3B82F6",
  };

  // ============================================================================
  // DEFAULT HEADER
  // ============================================================================
  if (variant === "default") {
    return (
      <>
        {/* Announcement Bar */}
        {show_announcement && resolvedAnnouncement && (
          <div 
            className="py-2 text-center text-sm text-white"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {announcement_link ? (
              <a href={announcement_link} className="hover:underline">
                {resolvedAnnouncement}
              </a>
            ) : (
              <span>{resolvedAnnouncement}</span>
            )}
          </div>
        )}

        <header className={`${baseHeaderClasses} ${premiumBackground}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              {logo_url || theme.logo_url ? (
                <img 
                  src={logo_url || theme.logo_url} 
                  alt="Logo" 
                  className="h-9 object-contain" 
                />
              ) : (
                <span className="text-xl font-bold" style={{ color: theme.primary_color }}>
                  {resolvedLogoText}
                </span>
              )}
            </a>

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex items-center gap-10 ${isRTL ? "flex-row-reverse" : ""}`}>
              {resolvedNavigation.map((item, i) => (
                <NavItem key={i} item={item} lang={lang} isRTL={isRTL} />
              ))}
            </nav>

            {/* CTA */}
            {resolvedCtaButton && (
              <a
                href={cta_url}
                className="hidden md:inline-block px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 shadow-md transition-all"
                style={ctaStyle}
              >
                {resolvedCtaButton}
              </a>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 animate-fade-down">
              <nav className="px-6 py-4 space-y-4">
                {resolvedNavigation.map((item, idx) => (
                  <MobileNavItem key={idx} item={item} lang={lang} />
                ))}

                {resolvedCtaButton && (
                  <a
                    href={cta_url}
                    className="block w-full px-6 py-3 text-white text-center rounded-xl font-semibold"
                    style={ctaStyle}
                  >
                    {resolvedCtaButton}
                  </a>
                )}
              </nav>
            </div>
          )}
        </header>
      </>
    );
  }

  // ============================================================================
  // TRANSPARENT HEADER
  // ============================================================================
  if (variant === "transparent") {
    return (
      <header
        className={`absolute top-0 left-0 right-0 z-50 transition-all ${
          scrolled
            ? "backdrop-blur-xl bg-white/20 border-b border-white/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-white text-2xl font-bold drop-shadow-lg">
            {resolvedLogoText}
          </div>

          <nav className="hidden md:flex gap-10">
            {resolvedNavigation.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                className="text-white text-lg hover:text-white/80 transition-all font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {resolvedCtaButton && (
            <a className="hidden md:inline-block px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold shadow hover:bg-gray-100">
              {resolvedCtaButton}
            </a>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20 px-6 py-4 space-y-3 text-white animate-fade-down">
            {resolvedNavigation.map((item, idx) => (
              <a key={idx} href={item.url} className="block py-2 text-lg">
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>
    );
  }

  return null;
}

// ============================================================================
// NAV ITEM COMPONENTS
// ============================================================================

function NavItem({ item, lang, isRTL }) {
  const [open, setOpen] = useState(false);
  const resolvedSubmenu = item.submenu ? resolveTranslatedArray(item.submenu, lang, ["label"]) : [];

  if (resolvedSubmenu.length > 0) {
    return (
      <div
        className="relative group"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium transition-colors">
          {item.label}
          <ChevronDown className={`w-4 h-4 mt-0.5 ${isRTL ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className={`absolute ${isRTL ? "right-0" : "left-0"} top-full mt-3 w-56 bg-white shadow-2xl rounded-xl border border-gray-100 p-2 animate-fade-down`}>
            {resolvedSubmenu.map((sub, idx) => (
              <a
                key={idx}
                href={sub.url}
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all"
              >
                {sub.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.url}
      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
    >
      {item.label}
    </a>
  );
}

function MobileNavItem({ item, lang }) {
  const [open, setOpen] = useState(false);
  const resolvedSubmenu = item.submenu ? resolveTranslatedArray(item.submenu, lang, ["label"]) : [];

  if (resolvedSubmenu.length > 0) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-between items-center py-2 text-gray-700 font-semibold"
        >
          {item.label}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="ml-4 mt-1 space-y-2">
            {resolvedSubmenu.map((sub, idx) => (
              <a
                key={idx}
                href={sub.url}
                className="block py-1 text-gray-600 hover:text-blue-600"
              >
                {sub.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.url}
      className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
    >
      {item.label}
    </a>
  );
}
