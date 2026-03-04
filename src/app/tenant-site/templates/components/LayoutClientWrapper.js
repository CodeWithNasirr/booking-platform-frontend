"use client";

import { TenantThemeProvider } from "../utils/theme";
import { TenantLangProvider } from "../utils/TenantLangContext";

/**
 * ============================================================================
 * SHARED CLIENT WRAPPER
 * ============================================================================
 * 
 * Wraps any layout with:
 *   ✓ Theme CSS variables (colors, fonts, radius)
 *   ✓ Language context (en/ar/ur with RTL support)
 * 
 * Used by both template previews AND live tenant sites.
 * 
 * @param {Object} theme - Theme config from template.theme_defaults or tenant.theme
 * @param {React.ReactNode} children - Layout content
 */
export default function LayoutClientWrapper({ theme, children }) {
  return (
    <TenantThemeProvider theme={theme}>
      <TenantLangProvider>
        {children}
      </TenantLangProvider>
    </TenantThemeProvider>
  );
}
