// "use client";

// import React, { createContext, useContext, useMemo } from "react";

// const TenantThemeContext = createContext(undefined);

// export function useTenantTheme() {
//   const ctx = useContext(TenantThemeContext);
//   if (!ctx) {
//     throw new Error("useTenantTheme must be used within TenantThemeProvider");
//   }
//   return ctx;
// }

// /**
//  * TenantThemeProvider
//  * 
//  * Wraps tenant site pages with theme configuration.
//  * Injects CSS variables for colors, fonts, spacing, etc.
//  * 
//  * @param {Object} theme - Theme configuration from backend
//  * @param {Object} themeDefaults - Default theme from template
//  * @param {React.ReactNode} children
//  */
// export function TenantThemeProvider({ theme = {}, themeDefaults = {}, children }) {
//   // Merge theme_defaults with tenant theme_config
//   const mergedTheme = useMemo(() => {
//     return {
//       // Colors
//       primary_color: theme.primary_color || themeDefaults.primary_color || "#3B82F6",
//       secondary_color: theme.secondary_color || themeDefaults.secondary_color || "#1E293B",
//       accent_color: theme.accent_color || themeDefaults.accent_color || "#10B981",
//       background_color: theme.background_color || themeDefaults.background_color || "#FFFFFF",
//       text_color: theme.text_color || themeDefaults.text_color || "#111827",
      
//       // Typography
//       font_family: theme.font_family || themeDefaults.font_family || "Inter, sans-serif",
//       heading_font: theme.heading_font || themeDefaults.heading_font || null,
//       font_size_base: theme.font_size_base || themeDefaults.font_size_base || "16px",
      
//       // Border Radius
//       border_radius: theme.border_radius || themeDefaults.border_radius || "0.5rem",
      
//       // Logo & Branding
//       logo_url: theme.logo_url || themeDefaults.logo_url || "",
//       business_name: theme.business_name || themeDefaults.business_name || "",
      
//       // Additional theme properties
//       ...themeDefaults,
//       ...theme,
//     };
//   }, [theme, themeDefaults]);

//   // Generate CSS variables
//   const cssVariables = useMemo(() => {
//     return {
//       "--color-primary": mergedTheme.primary_color,
//       "--color-secondary": mergedTheme.secondary_color,
//       "--color-accent": mergedTheme.accent_color,
//       "--color-background": mergedTheme.background_color,
//       "--color-text": mergedTheme.text_color,
//       "--font-family": mergedTheme.font_family,
//       "--font-heading": mergedTheme.heading_font || mergedTheme.font_family,
//       "--font-size-base": mergedTheme.font_size_base,
//       "--border-radius": mergedTheme.border_radius,
//     };
//   }, [mergedTheme]);

//   return (
//     <TenantThemeContext.Provider value={mergedTheme}>
//       <div style={cssVariables} className="tenant-theme-root">
//         {children}
//       </div>
//     </TenantThemeContext.Provider>
//   );
// }

// export default TenantThemeProvider;
"use client";

import { createContext, useContext, useMemo } from "react";

const TenantThemeContext = createContext(undefined);

export function useTenantTheme() {
  const ctx = useContext(TenantThemeContext);
  if (!ctx) {
    throw new Error("useTenantTheme must be used within TenantThemeProvider");
  }
  return ctx;
}

export function TenantThemeProvider({ theme = {}, children }) {
  // Generate CSS variables (SAFE + SYNC)
  const cssVariables = useMemo(() => {
    const vars = {};

    // 🎨 Colors
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (value) vars[`--color-${key}`] = value;
      });
    }

    // 🔤 Fonts — set BOTH the builder-style vars (--font-base/--font-heading)
    // AND the names the public storefront stylesheet actually consumes
    // (--font-family for body, --heading-font-family for headings), so a font
    // chosen in Builder OR Branding reaches the live site. Branding stores a
    // bare family ("Poppins"); add a generic fallback if there's no stack.
    const withFallback = (f) =>
      f && !String(f).includes(",") ? `${f}, system-ui, sans-serif` : f;
    if (theme.fonts?.base) {
      const base = withFallback(theme.fonts.base);
      vars["--font-base"] = base;
      vars["--font-family"] = base;
    }
    if (theme.fonts?.heading || theme.fonts?.base) {
      const heading = withFallback(theme.fonts?.heading || theme.fonts?.base);
      vars["--font-heading"] = heading;
      vars["--heading-font-family"] = heading;
    }

    // 🟦 Radius & Shadow — likewise alias --border-radius (storefront) alongside
    // --radius (builder).
    if (theme.radius) {
      vars["--radius"] = theme.radius;
      vars["--border-radius"] = theme.radius;
    }
    if (theme.shadow) vars["--shadow"] = theme.shadow;

    return vars;
  }, [theme]);

  // Apply the base font on the wrapper so ALL content inherits it (body text
  // otherwise keeps the stylesheet's inherited default). Headings still switch
  // to the heading font via var(--heading-font-family) in styles.css.
  const rootStyle = useMemo(() => {
    const s = { ...cssVariables };
    if (cssVariables["--font-family"]) s.fontFamily = cssVariables["--font-family"];
    return s;
  }, [cssVariables]);

  return (
    <TenantThemeContext.Provider value={theme}>
      <div className="tenant-theme-root" style={rootStyle}>
        {children}
      </div>
    </TenantThemeContext.Provider>
  );
}

/** ✅ IMPORTANT: DEFAULT EXPORT */
export default TenantThemeProvider;
