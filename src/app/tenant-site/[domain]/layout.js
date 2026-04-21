/**
 * /tenant-site/[domain]/layout.js
 * 
 * Root layout for tenant sites.
 * 
 * Responsibilities:
 * 1. Fetch tenant site configuration by domain
 * 2. Wrap children with TenantThemeProvider (CSS variables)
 * 3. Wrap children with TenantLangProvider (RTL support)
 * 4. Set meta tags, favicon, etc.
 * 
 * This follows the EXACT same pattern as TemplateClientWrapper.
 */

import { fetchSite, fetchTheme } from "./utils/fetchSite";
import TenantClientWrapper from "./TenantClientWrapper";

import "./styles.css"
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const resolved = await params; // unwrap params promise
  const domain = resolved.domain;
  
  try {
    const { site, error } = await fetchSite(domain);
    
    if (error || !site) {
      return {
        title: "Site Not Found",
        description: "The requested site could not be found.",
      };
    }

    return {
      title: site.seo_title || site.tenant?.name || "Welcome",
      description: site.seo_description || "",
      keywords: site.seo_keywords || "",
      openGraph: {
        title: site.seo_title || site.tenant?.name,
        description: site.seo_description,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Welcome",
      description: "",
    };
  }
}



export default async function TenantSiteLayout({ children, params }) {
  // const { domain } = params;      // params is a ReactPromise
  const resolved = await params; // unwrap it

  const domain = resolved.domain;

  console.log(domain,"DDDDDDDDDDDDDDD")
  
  // Fetch site and theme data (SSR)
  const { site, theme, error } = await fetchSite(domain);
  // Handle site not found
  if (error || !site) {
    return (
      <html lang="en" dir="ltr">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Site Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                The site "{domain}" could not be found or is not published.
              </p>
              <a
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Go Home
              </a>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Extract configuration
  const rtlEnabled = site.rtl_enabled || false;
  const themeDefaults = site.template?.theme_defaults || {};
  const themeConfig = site.theme_config || {};

  // Merge theme_defaults + theme_config
  const mergedTheme = {
    ...themeDefaults,
    ...themeConfig,
    ...theme,
  };

  // Default language (can be extended from site settings)
  const defaultLang = site.settings?.default_language || "en";
  const supportedLanguages = site.settings?.supported_languages || ["en", "ar", "ur"];
  const tenantTimezone = site.tenant_timezone || "UTC";

  return (
    <TenantClientWrapper
      theme={mergedTheme}
      themeDefaults={themeDefaults}
      defaultLang={defaultLang}
      rtlEnabled={rtlEnabled}
      supportedLanguages={supportedLanguages}
      site={site}
      tenantTimezone={tenantTimezone}
    >
      {children}
    </TenantClientWrapper>
  );
}
