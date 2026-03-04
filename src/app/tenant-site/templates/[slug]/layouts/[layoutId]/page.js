/**
 * ============================================================================
 * TEMPLATE LAYOUT PREVIEW PAGE
 * ============================================================================
 * 
 * Route: /tenant-site/templates/[slug]/layouts/[layoutId]
 * 
 * ARCHITECTURE: THIN ADAPTER PATTERN
 * 
 * This page does ONLY TWO things:
 *   1. Fetch template layout JSON from API
 *   2. Pass data to shared components
 * 
 * All rendering logic lives in:
 *   - LayoutRenderer (shared)
 *   - Section components (shared)
 *   - LayoutClientWrapper (shared)
 * 
 * WHY THIS ARCHITECTURE?
 * 
 * Enterprise SaaS platforms (Wix, Webflow, Squarespace) use this exact pattern:
 *   - Templates and live sites share IDENTICAL rendering code
 *   - Only the DATA SOURCE differs
 *   - Template JSON structure === Live site JSON structure
 *   - Zero duplication, zero divergence
 * 
 * This means:
 *   ✓ What you see in preview = What you get when live
 *   ✓ Bug fixes propagate to all views
 *   ✓ New section components work everywhere automatically
 *   ✓ Consistent behavior guaranteed
 * 
 * ============================================================================
 */

import axios from "@/lib/axios";

// ============================================
// SHARED COMPONENTS
// These are the SAME components used by:
//   - Live tenant sites (/[domain])
//   - Website builder preview
//   - This template preview
// ============================================


import LayoutRenderer from "../../../components/LayoutRenderer";
import LayoutClientWrapper from "../../../components/LayoutClientWrapper";
import PreviewBanner from "./PreviewBanner";

// ============================================
// PAGE COMPONENT
// ============================================
export default async function TemplateLayoutPreviewPage({ params }) {
  // Next.js 15: params is a promise
  const { slug, layoutId } = await params;

  // ============================================
  // DATA FETCHING
  // This is the ONLY thing different from live sites
  // Live sites fetch: /api/v1/website/layout/ (tenant-scoped)
  // Templates fetch:  /api/v1/website/templates/{slug}/layouts/{layoutId}/
  // ============================================
  let template = null;
  let layout = null;
  let themeDefaults = null;
  let error = null;

  try {
    const res = await axios.get(
      `/api/v1/website/templates/${slug}/layouts/${layoutId}/`
    );

    template = res.data.template;
    layout = res.data.layout;
    themeDefaults = res.data.theme_defaults;
  } catch (err) {
    console.error("[TemplatePreview] Fetch error:", err?.message);
    error = err?.response?.data?.detail || err?.message || "Failed to load template";
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !layout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-10 bg-white rounded-3xl shadow-xl max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Template Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            {error || `Could not load layout "${layoutId}" for template "${slug}"`}
          </p>
          <a
            href="/tenant-site/templates"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse All Templates
          </a>
        </div>
      </div>
    );
  }

  // ============================================
  // SUCCESS: RENDER USING SHARED COMPONENTS
  // ============================================
  const sections = layout?.sections || [];

  return (
    <LayoutClientWrapper theme={themeDefaults}>
      {/* Preview banner (only shown on template previews) */}
      <PreviewBanner template={template} layout={layout} />

      {/* 
        SHARED RENDERER
        This is IDENTICAL to what renders live tenant sites.
        Same components, same logic, different data source.
      */}
      <LayoutRenderer
        sections={sections}
        template={template}
        layout={layout}
      />
    </LayoutClientWrapper>
  );
}

// ============================================
// METADATA
// ============================================
export async function generateMetadata({ params }) {
  const { slug, layoutId } = await params;

  // Could fetch template name for better SEO, but keeping simple
  return {
    title: `${slug} - ${layoutId} | Template Preview | BookingPro`,
    description: `Preview the ${layoutId} layout for the ${slug} template. See exactly how your booking website will look.`,
    robots: "noindex, nofollow", // Don't index preview pages
  };
}
