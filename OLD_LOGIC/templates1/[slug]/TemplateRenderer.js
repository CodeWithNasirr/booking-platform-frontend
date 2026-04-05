"use client";

import mapSectionToComponent from "../utils/map";

export default function TemplateRenderer({ layout }) {
  // console.log(template)
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple preview header */}
      <header className="w-full border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              {/* {template.slug}{" "} */}
              <span className="text-xs text-slate-400">Template Preview</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              This is a live preview of the public booking site layout.
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            BookingPro · Preview only · Not your final content
          </span>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {layout.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No sections configured for this template yet.
            </div>
          )}

          {layout.map((section, idx) => {
            const Component = mapSectionToComponent(section.section_type);
            if (!Component) return null;

            return (
              <section key={idx} className="border-b last:border-b-0">
                <Component data={section} />
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
