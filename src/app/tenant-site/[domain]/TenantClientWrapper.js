"use client";

/**
 * TenantClientWrapper.js
 * 
 * Client-side wrapper that provides Theme and Language contexts.
 * 
 * This follows the EXACT same pattern as TemplateClientWrapper:
 * 
 * <TenantThemeProvider theme={theme}>
 *   <TenantLangProvider>
 *     {children}
 *   </TenantLangProvider>
 * </TenantThemeProvider>
 */

import React, { createContext, useContext, useMemo } from "react";
import TenantThemeProvider from "../contexts/TenantThemeContext";
import TenantLangProvider from "../contexts/TenantLangContext";
      
import { TenantRBACProvider } from "@/contexts/TenantRBACContext";

// Site context for accessing site data throughout the app
export const TenantSiteContext = createContext(null);

export function useTenantSite() {
  const ctx = useContext(TenantSiteContext);
  if (!ctx) {
    throw new Error("useTenantSite must be used within TenantClientWrapper");
  }
  return ctx;
}

/**
 * TenantClientWrapper
 * 
 * Wraps children with all necessary providers:
 * - TenantThemeProvider (CSS variables, colors, fonts)
 * - TenantLangProvider (language, RTL)
 * - TenantSiteContext (site data access)
 * 
 * @param {Object} props
 * @param {Object} props.theme - Merged theme configuration
 * @param {Object} props.themeDefaults - Default theme from template
 * @param {string} props.defaultLang - Default language code
 * @param {boolean} props.rtlEnabled - RTL enabled flag
 * @param {string[]} props.supportedLanguages - Supported language codes
 * @param {Object} props.site - Full site configuration
 * @param {React.ReactNode} props.children
 */
export default function TenantClientWrapper({
  theme = {},
  themeDefaults = {},
  defaultLang = "en",
  rtlEnabled = false,
  supportedLanguages = ["en", "ar", "ur"],
  site = {},
  tenantTimezone = "UTC",   // ✅ ADD THIS
  children,
}) {
  // Memoize site context value
  const siteContextValue = useMemo(() => ({
    site,
    subdomain: site.subdomain,
    customDomain: site.custom_domain,
    businessName: theme.business_name || site.tenant?.name || "",
    logoUrl: theme.logo_url || "",
    isPublished: site.is_published,
    publishedAt: site.published_at,
    templateSlug: site.template?.slug,
    templateName: site.template?.name,
    // ✅ IMPORTANT
    timezone: tenantTimezone,
    currency: site.currency || "SAR",
  }), [site, theme]);

  return (
    <TenantSiteContext.Provider value={siteContextValue}>
      {/* <TenantRBACProvider> */}
        <TenantThemeProvider theme={theme} themeDefaults={themeDefaults}>
          <TenantLangProvider
            defaultLang={defaultLang}
            rtlEnabled={rtlEnabled}
            supportedLanguages={supportedLanguages}
          >
            {/* Main content wrapper with theme CSS variables applied */}
            <div className="tenant-site-wrapper min-h-screen">
              {children}
            </div>
          </TenantLangProvider>
        </TenantThemeProvider>
      {/* </TenantRBACProvider> */}
    </TenantSiteContext.Provider>
  );
}
