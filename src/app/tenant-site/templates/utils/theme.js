"use client";

import { createContext, useContext, useEffect } from "react";

/**
 * ============================================================================
 * TENANT THEME PROVIDER
 * ============================================================================
 * 
 * Injects theme values as CSS variables on :root
 * 
 * Theme structure:
 * {
 *   colors: { primary, secondary, background, text, ... },
 *   fonts: { base, heading },
 *   radius: "12px"
 * }
 * 
 * CSS Variables created:
 *   --color-primary, --color-secondary, etc.
 *   --font-base, --font-heading
 *   --radius
 * 
 * ============================================================================
 */

const ThemeContext = createContext({});

export function TenantThemeProvider({ theme, children }) {
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;

    // Inject color variables
    const colors = theme.colors || {};
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Inject font variables
    const fonts = theme.fonts || {};
    Object.entries(fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Inject border radius
    root.style.setProperty("--radius", theme.radius || "12px");

    // Cleanup on unmount
    return () => {
      Object.keys(colors).forEach((key) => {
        root.style.removeProperty(`--color-${key}`);
      });
      Object.keys(fonts).forEach((key) => {
        root.style.removeProperty(`--font-${key}`);
      });
      root.style.removeProperty("--radius");
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme || {}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
