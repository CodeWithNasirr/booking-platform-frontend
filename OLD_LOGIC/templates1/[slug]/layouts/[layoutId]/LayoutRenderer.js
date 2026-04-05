"use client";

import mapSectionToComponent from "../../../utils/map";


export default function LayoutRenderer({ sections, template, layout }) {
  const headerSection = sections.find((s) => s.section_type === "header");
  const heroSection = sections.find((s) => s.section_type === "hero");

  const contentSections = sections.filter(
    (s) => s.section_type !== "header" && s.section_type !== "hero"
  );

  const HeaderComponent = headerSection
    ? mapSectionToComponent("header")
    : null;

  const HeroComponent = heroSection
    ? mapSectionToComponent("hero")
    : null;

  const floating = heroSection?.content?.floating_card;

  // Calculate floating card position based on style
  const floatingPosition = {
    center: "left-1/2 -translate-x-1/2",
    floating_right: "right-10",
    bottom_right: "right-10 bottom-10",
  }[floating?.style || "center"];
  const layoutBackground =
  layout?.settings?.background ||
  "var(--color-background)";


  return (
    <div className="min-h-screen relative"
        style={{ background: layoutBackground }}
      >



      {/* ================= HEADER ================= */}
      {HeaderComponent && (
        <HeaderComponent data={headerSection.content} />
      )}

      {/* ================= HERO ================= */}
      {HeroComponent && (
        <section className="relative">
          <HeroComponent data={heroSection.content} />
        </section>
      )}

      {/* ================= OTHER CONTENT ================= */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-transparent">


          {contentSections.map((section, idx) => {
            const Component = mapSectionToComponent(section.section_type);

            if (!Component) {
              return (
                <div
                  key={idx}
                  className="p-4 bg-yellow-50 border-b text-sm text-yellow-700"
                >
                  ⚠️ Component not found: {section.section_type}
                </div>
              );
            }

            return (
              <section key={idx} className="border-b last:border-b-0">
                <Component data={section.content} />
              </section>
            );
          })}

        </div>
      </main>
    </div>
  );
}
