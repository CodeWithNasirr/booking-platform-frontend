"use client";

import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext({});

export function TenantThemeProvider({ theme, children }) {
  useEffect(() => {
    if (!theme) return;
    
    const root = document.documentElement;
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};

    // inject CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    root.style.setProperty("--radius", theme.radius || "12px");
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
