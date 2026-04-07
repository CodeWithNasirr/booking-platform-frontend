/**
 * fetchSite.js
 * 
 * Fetches tenant site configuration, theme, layout, and pages from backend.
 * 
 * API Endpoints:
 * - GET /api/v1/website/tenant/{domain}/          → TenantSite details
 * - GET /api/v1/website/tenant/{domain}/layout/   → SiteLayout (layout_json)
 * - GET /api/v1/website/tenant/{domain}/theme/    → Merged theme (theme_defaults + theme_config)
 * - GET /api/v1/website/tenant/{domain}/pages/    → SitePages list
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch complete tenant site data by domain
 * 
 * @param {string} domain - Subdomain or custom domain
 * @returns {Promise<Object>} - { site, theme, sections, pages, error }
 */
// export async function fetchSite(domain) {
//   const headers = {
//     "Content-Type": "application/json",
//     // "X-Tenant-Domain": domain,
//   };

//   try {
//     // Fetch all data in parallel
//     const [siteRes, layoutRes, themeRes, pagesRes] = await Promise.all([
//       fetch(`${API_BASE}/api/v1/website/tenant/${domain}/`, { 
//         headers,
//         cache: "no-store", // SSR - always fresh
//       }),
//       fetch(`${API_BASE}/api/v1/website/tenant/${domain}/layout/`, { 
//         headers,
//         cache: "no-store",
//       }),
//       fetch(`${API_BASE}/api/v1/website/tenant/${domain}/theme/`, { 
//         headers,
//         cache: "no-store",
//       }),
//       fetch(`${API_BASE}/api/v1/website/tenant/${domain}/pages/`, { 
//         headers,
//         cache: "no-store",
//       }),
//     ]);

//     // Check for errors
//     if (!siteRes.ok) {
//       const errorData = await siteRes.json().catch(() => ({}));
//       return {
//         site: null,
//         theme: null,
//         sections: [],
//         pages: [],
//         error: errorData.detail || `Site not found: ${domain}`,
//         status: siteRes.status,
//       };
//     }

//     // Parse responses
//     const site = await siteRes.json();
//     const layout = layoutRes.ok ? await layoutRes.json() : { layout_json: [] };
//     const theme = themeRes.ok ? await themeRes.json() : {};
//     const pages = pagesRes.ok ? await pagesRes.json() : [];

//     // Extract sections from layout
//     const sections = layout.layout_json || layout.sections || [];

//     return {
//       site,
//       theme,
//       sections,
//       pages: Array.isArray(pages) ? pages : pages.results || [],
//       error: null,
//       status: 200,
//     };
//   } catch (error) {
//     console.error("[fetchSite] Error:", error);
//     return {
//       site: null,
//       theme: null,
//       sections: [],
//       pages: [],
//       error: error.message || "Failed to fetch site data",
//       status: 500,
//     };
//   }
// }



export async function fetchSite(domain) {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/website/tenant/${domain}/full/`,
      {
        headers: {
          "Content-Type": "application/json",
          // "X-Tenant-Domain": domain,
        },
        cache: "no-store", // SSR
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        site: null,
        theme: null,
        sections: [],
        pages: [],
        error: err.detail || "Site not found",
        status: res.status,
      };
    }

    const data = await res.json();
    return {
      site: data.site,
      theme: data.theme,
      sections: data.sections || [],
      pages: data.pages || [],
      error: null,
      status: 200,
    };
  } catch (error) {
    console.error("[fetchSite]", error);
    return {
      site: null,
      theme: null,
      sections: [],
      pages: [],
      error: error.message || "Failed to fetch site",
      status: 500,
    };
  }
}







/**
 * Fetch single page by slug
 * 
 * @param {string} domain - Tenant domain
 * @param {string} slug - Page slug (empty string for homepage)
 * @returns {Promise<Object>} - Page data
 */
export async function fetchPage(domain, slug = "") {
  const headers = {
    "Content-Type": "application/json",
    // "X-Tenant-Domain": domain,
  };

  try {
    const pageSlug = slug || "home";
    const res = await fetch(
      `${API_BASE}/api/v1/website/tenant/${domain}/pages/${pageSlug}/`,
      { headers, cache: "no-store" }
    );

    if (!res.ok) {
      return { page: null, error: "Page not found" };
    }

    const page = await res.json();
    return { page, error: null };
  } catch (error) {
    return { page: null, error: error.message };
  }
}

/**
 * Fetch theme configuration only
 * 
 * @param {string} domain - Tenant domain
 * @returns {Promise<Object>} - Theme configuration
 */
export async function fetchTheme(domain) {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/website/tenant/${domain}/theme/`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Domain": domain,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return { theme: {}, error: "Failed to fetch theme" };
    }

    const theme = await res.json();
    return { theme, error: null };
  } catch (error) {
    return { theme: {}, error: error.message };
  }
}

/**
 * Check if domain exists and is published
 * 
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>}
 */
export async function checkDomainExists(domain) {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/website/tenant/${domain}/check/`,
      {
        method: "HEAD",
        headers: { "X-Tenant-Domain": domain },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// export default fetchSite;