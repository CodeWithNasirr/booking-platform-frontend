"use client";

import { Eye, ExternalLink } from "lucide-react";

/**
 * TEMPLATE PREVIEW BANNER
 * 
 * Shown ONLY on template preview pages to indicate this is a preview,
 * not a live tenant site. Similar to Wix/Webflow preview mode.
 */
export default function PreviewBanner({ template, layout }) {
  const templateName = typeof template?.name === "object" 
    ? template.name.en || Object.values(template.name)[0]
    : template?.name || "Template";

  const layoutName = typeof layout?.layout_name === "object"
    ? layout.layout_name.en || Object.values(layout.layout_name)[0]
    : layout?.layout_name || "Layout";

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm">
            <Eye className="w-4 h-4" />
            <span>Preview Mode</span>
          </div>
          
          <span className="text-sm text-white/80">
            {templateName} — {layoutName}
          </span>
        </div>

        {/* <div className="flex items-center gap-3">
          <a
            href="/tenant-site/templates"
            className="text-sm text-white/80 hover:text-white flex items-center gap-1"
          >
            Browse Templates
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Use This Template
          </button>
        </div> */}
      </div>
    </div>
  );
}
