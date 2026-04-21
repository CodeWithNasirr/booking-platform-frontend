/**
 * /tenant-site/[domain]/page.js
 * 
 * Main homepage for tenant sites.
 * 
 * Responsibilities:
 * 1. Fetch tenant site by domain
 * 2. Fetch layout JSON
 * 3. Merge theme_defaults + theme_config
 * 4. Render using LayoutRenderer (EXACTLY like templates)
 * 5. Use resolveTranslated for all multilingual fields
 */

import { fetchSite } from "./utils/fetchSite";
import LayoutRenderer from "./LayoutRenderer";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function TenantHomePage(props ) {
  const { params } = props;       // params is a ReactPromise
  const resolved = await params;  // unwrap it

  const domain = resolved.domain

  
  // Fetch all site data
  const { site, theme, sections, error, status } = await fetchSite(domain);

  console.log("Fetched site data:", { site, theme, sections, error, status });
  // Handle errors
  if (error || !site) {
    if (status === 404) {
      notFound();
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Unable to load site. Please try again later."}
          </p>
         <a
          href="."
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 inline-block"
        >
          Retry
        </a>
        </div>
      </div>
    );
  }

  // Check if site is published
  if (!site.is_published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Site Not Published
          </h1>
          <p className="text-gray-600">
            This site is currently in draft mode and not available to the public.
          </p>
        </div>
      </div>
    );
  }

  // Extract template and layout info
  const template = site.template || {};
  const themeDefaults = template.theme_defaults || {};
  const themeConfig = site.theme_config || {};

  // Merge themes: defaults < config < fetched theme
  const mergedTheme = {
    ...themeDefaults,
    ...themeConfig,
    ...theme,
  };

  // RTL configuration
  const rtlEnabled = site.rtl_enabled || false;

  return (
    <LayoutRenderer
      sections={sections}
      template={template}
      theme={mergedTheme}
      site={site}
      rtlEnabled={rtlEnabled}
      domain={domain}
    />
  );
}

// Generate static params for known domains (optional optimization)
export async function generateStaticParams() {
  // In production, you could fetch all published domains here
  // For now, return empty array for dynamic rendering
  return [];
}
