// "use client";

// import { TenantThemeProvider } from "../utils/theme";
// import { TenantLangProvider } from "../utils/TenantLangContext";

// /**
//  * ============================================================================
//  * SHARED CLIENT WRAPPER
//  * ============================================================================
//  * 
//  * Wraps any layout with:
//  *   ✓ Theme CSS variables (colors, fonts, radius)
//  *   ✓ Language context (en/ar/ur with RTL support)
//  * 
//  * Used by both template previews AND live tenant sites.
//  * 
//  * @param {Object} theme - Theme config from template.theme_defaults or tenant.theme
//  * @param {React.ReactNode} children - Layout content
//  */
// export default function LayoutClientWrapper({ theme, children }) {
//   return (
//     <TenantThemeProvider theme={theme}>
//       <TenantLangProvider>
//         {children}
//       </TenantLangProvider>
//     </TenantThemeProvider>
//   );
// }

"use client";

/**
 * LayoutClientWrapper (template preview)
 *
 * Uses the same providers as live tenant sites so template previews
 * render through the identical section components.
 *
 * Three providers required by domain sections:
 *   - TenantThemeProvider  → useTenantTheme()
 *   - TenantLangProvider   → useTenantLang()
 *   - TenantSiteContext    → useTenantSite()  (ContactForm, etc.)
 */

import { useMemo } from "react";
import TenantThemeProvider from "../../contexts/TenantThemeContext";
import TenantLangProvider  from "../../contexts/TenantLangContext";
import { TenantSiteContext } from "../../[domain]/TenantClientWrapper";

export default function LayoutClientWrapper({
  theme = {},
  site  = {},
  defaultLang = "en",
  supportedLanguages = ["en", "ar", "ur"],
  children,
}) {
  // Build a site context value compatible with useTenantSite()
  const siteContextValue = useMemo(() => ({
    site,
    subdomain:    site.subdomain    || null,
    customDomain: site.custom_domain || null,
    businessName: theme.business_name || site.tenant?.name || "",
    logoUrl:      theme.logo_url || "",
    isPublished:  site.is_published ?? true,
    publishedAt:  site.published_at  || null,
    templateSlug: site.template?.slug || null,
    templateName: site.template?.name || null,
    timezone:     "UTC",
  }), [site, theme]);

  return (
    <TenantSiteContext.Provider value={siteContextValue}>
      <TenantThemeProvider theme={theme}>
        <TenantLangProvider
          defaultLang={defaultLang}
          supportedLanguages={supportedLanguages}
        >
          {children}
        </TenantLangProvider>
      </TenantThemeProvider>
    </TenantSiteContext.Provider>
  );
}