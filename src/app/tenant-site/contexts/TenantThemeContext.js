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

    // 🔤 Fonts
    if (theme.fonts?.base) vars["--font-base"] = theme.fonts.base;
    if (theme.fonts?.heading) vars["--font-heading"] = theme.fonts.heading;

    // 🟦 Radius & Shadow
    if (theme.radius) vars["--radius"] = theme.radius;
    if (theme.shadow) vars["--shadow"] = theme.shadow;

    return vars;
  }, [theme]);

  return (
    <TenantThemeContext.Provider value={theme}>
      <div className="tenant-theme-root" style={cssVariables}>
        {children}
      </div>
    </TenantThemeContext.Provider>
  );
}

/** ✅ IMPORTANT: DEFAULT EXPORT */
export default TenantThemeProvider;
