/**
 * Dynamic Page Renderer
 * app/tenant-site/[domain]/[slug]/page.js
 * 
 * Renders individual pages like /about, /services, /contact
 * Fetches page-specific content from API
 */

import { notFound } from 'next/navigation';
import { fetchSite, fetchPage } from '../utils/fetchSite';
import LayoutRenderer from '../LayoutRenderer';

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { domain, slug } = params;

  const [siteResult, pageResult] = await Promise.all([
    fetchSite(domain),
    fetchPage(domain, slug),
  ]);

  const { site } = siteResult;
  const { page, error } = pageResult;

  if (error || !page) {
    return { title: "Page Not Found" };
  }

  const title =
    typeof page.title === "object"
      ? page.title.en || Object.values(page.title)[0]
      : page.title;

  return {
    title: page.seo_title || title,
    description: page.seo_description || "",

    // 🔥 ADD THIS
    icons: {
      icon: site?.tenant_favicon || "/favicon.ico",
    },
  };
}

export default async function TenantPage({ params }) {
  const { domain, slug } = await params;

  // Fetch site data (for header/footer) and page data
  const [siteResult, pageResult] = await Promise.all([
    fetchSite(domain),
    fetchPage(domain, slug),
  ]);
  
  const { site, theme, sections, error: siteError } = siteResult;
  const { page, error: pageError } = pageResult;

  
  // Handle errors
  if (siteError || !site?.is_published) {
    notFound();
  }
  
  if (pageError || !page) {
    // notFound();
     return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600">
            This page is not found or not available.
          </p>
        </div>
      </div>
    );
  }

  // Get header and footer from site layout
  const header = sections.find(s => s.section_type === 'header');
  const footer = sections.find(s => s.section_type === 'footer');
  
  // Build page sections from content_blocks
  const pageSections = (page.content_blocks || []).map((block, idx) => ({
    id: `page_block_${idx}`,
    section_type: block.type || block.section_type,
    order: idx + 1,
    content: block.content || block,
  }));
  
  // console.log(pageSections,"PPPPPPPPPPPPPPPPPPPPPPP")
  // Combine: header + page content + footer
  const fullSections = [
    ...(header ? [header] : []),
    ...pageSections,
    ...(footer ? [footer] : []),
  ];
  return (
    <LayoutRenderer 
      sections={fullSections} 
      language={site.default_language} 
      site={site}
    />
  );
}

// Optional: Generate static paths for common pages
export async function generateStaticParams({ params }) {
  const { domain } = params;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/website/tenant/${domain}/pages/`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.pages || []).map(page => ({
      slug: page.slug,
    }));
  } catch {
    return [];
  }
}
