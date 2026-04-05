"use client";

import { resolveTranslated } from "../utils/lang";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import TenantLanguageSwitcher from "../utils/LanguageSwitcher";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";
export default function Header({ data }) {
  const { lang } = useTenantLang();
  const isRTL = lang === "ar" || lang === "ur";

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};
  const logo = content.logo || {};
  const navigation = content.nav_links || [];
  const cta_button = content.cta_button;
  const style = content.style || {};
  const sticky = style?.sticky ?? true;
  const cta_url = cta_button?.url || "#";
  // console.log(style)
  /* ---------------- STATE ---------------- */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  /* ---------------- BACKGROUND ---------------- */
  const headerStyle = resolveBackground(style.background, { scrolled });
  
  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "var(--font-base)" }}>
      {/* Language Switcher */}
      <div className="flex justify-end p-2">
        <TenantLanguageSwitcher />
      </div>

      <header
        className={`z-50 transition-all ${sticky ? "sticky top-0" : ""}`}
        style={headerStyle}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logo.image_url ? (
              <img src={logo.image_url} className="h-9 object-contain" />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {resolveTranslated(logo.text, lang)}
              </span>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navigation.map((item, i) => (
              <DesktopNavItem key={i} item={item} lang={lang} isRTL={isRTL} />
            ))}
          </nav>

          {/* CTA */}
          {cta_button && (
            <a
              href={cta_url}
              className="hidden md:flex px-6 py-3 font-semibold shadow-md"
              style={{
                background: "var(--color-primary)",
                color: "white",
                borderRadius: "var(--radius)",
              }}
            >
              {resolveTranslated(cta_button.text, lang)}
            </a>
          )}

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-6 py-4 space-y-4"
            style={{ background: "var(--color-background)" }}
          >
            {navigation.map((item, idx) => (
              <MobileNavItem key={idx} item={item} lang={lang} />
            ))}

            {cta_button && (
              <a
                href={cta_url}
                className="block w-full px-6 py-3 text-center font-semibold"
                style={{
                  background: "var(--color-primary)",
                  color: "white",
                  borderRadius: "var(--radius)",
                }}
              >
                {resolveTranslated(cta_button.text, lang)}
              </a>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

/* ---------------- NAV ITEMS ---------------- */

function DesktopNavItem({ item, lang, isRTL }) {
  const [open, setOpen] = useState(false);
  const hasSubmenu = item.submenu?.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button  style={resolveTextColor("default")} className="flex items-center gap-1 hover:text-[var(--color-primary)] transition">
        {resolveTranslated(item.label, lang)}
        {hasSubmenu && <ChevronDown className="w-4 h-4" />}
      </button>

      {open && hasSubmenu && (
        <div
          className="absolute top-full mt-3 w-56 rounded-xl shadow-xl p-2"
          style={{
            background: "var(--color-background)",
            border: "1px solid var(--color-border, #e5e7eb)",
            [isRTL ? "right" : "left"]: 0,
          }}
        >
          {item.submenu.map((sub, idx) => (
            <a
              key={idx}
              href={sub.url}
              style={resolveTextColor("default")} className="block px-4 py-2 rounded-lg hover:bg-[var(--color-background-soft)]"
            >
              {resolveTranslated(sub.label, lang)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ item, lang }) {
  return (
    <a
      href={item.url}
      style={resolveTextColor("default")} className="block py-2 hover:text-[var(--color-primary)] font-medium"
    >
      {resolveTranslated(item.label, lang)}
    </a>
  );
}
