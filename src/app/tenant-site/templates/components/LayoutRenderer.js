"use client";

import mapSectionToComponent from "../utils/map";

/**
 * ============================================================================
 * SHARED LAYOUT RENDERER
 * ============================================================================
 * 
 * ARCHITECTURE: Enterprise SaaS pattern (Wix/Webflow/Squarespace)
 * 
 * This is the SINGLE SOURCE OF TRUTH for rendering any layout JSON.
 * Both template previews and live tenant sites use this SAME renderer.
 * 
 * Used by:
 *   ✓ Template previews  → /templates/[slug]/layouts/[layoutId]
 *   ✓ Live tenant sites  → /[domain] (should import this)
 *   ✓ Website builder    → Editor preview canvas
 * 
 * Why this matters:
 *   - Zero code duplication
 *   - Templates render EXACTLY like live sites
 *   - Bug fixes propagate everywhere
 *   - Consistent behavior guaranteed
 * 
 * ============================================================================
 */

export default function LayoutRenderer({ sections = [], template, layout }) {
  // ============================================
  // SECTION CATEGORIZATION
  // Structural elements (header/hero/footer) are
  // rendered outside the main content flow
  // ============================================
  const headerSection = sections.find((s) => s.section_type === "header");
  const heroSection = sections.find((s) => s.section_type === "hero");
  const footerSection = sections.find((s) => s.section_type === "footer");

  const contentSections = sections.filter(
    (s) =>
      s.section_type !== "header" &&
      s.section_type !== "hero" &&
      s.section_type !== "footer"
  );

  // ============================================
  // COMPONENT RESOLUTION
  // ============================================
  const HeaderComponent = headerSection ? mapSectionToComponent("header") : null;
  const HeroComponent = heroSection ? mapSectionToComponent("hero") : null;
  const FooterComponent = footerSection ? mapSectionToComponent("footer") : null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-background, #ffffff)",
        color: "var(--color-text, #111827)",
        fontFamily: "var(--font-base, Inter, system-ui, sans-serif)",
      }}
    >
      {/* HEADER */}
      {HeaderComponent && headerSection && (
        <HeaderComponent data={headerSection.content || headerSection} />
      )}

      {/* HERO */}
      {HeroComponent && heroSection && (
        <HeroComponent data={heroSection.content || heroSection} />
      )}

      {/* CONTENT SECTIONS */}
      <main>
        {contentSections.map((section, idx) => {
          const Component = mapSectionToComponent(section.section_type);

          if (!Component) {
            if (process.env.NODE_ENV === "development") {
              return (
                <div
                  key={idx}
                  className="p-4 bg-amber-50 border-y border-amber-200 text-sm text-amber-700"
                >
                  ⚠️ Unknown section: <code>{section.section_type}</code>
                </div>
              );
            }
            return null;
          }

          return (
            <section key={`${section.section_type}-${idx}`}>
              <Component data={section.content || section} />
            </section>
          );
        })}
      </main>

      {/* FOOTER */}
      {FooterComponent && footerSection && (
        <FooterComponent data={footerSection.content || footerSection} />
      )}
    </div>
  );
}
