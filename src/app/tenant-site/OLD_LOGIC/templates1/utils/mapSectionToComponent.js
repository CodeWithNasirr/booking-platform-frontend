/**
 * mapSectionToComponent.js
 * 
 * EXACT SAME MAPPING as src/app/tenant-site/templates/utils/map.js
 * 
 * Maps section_type to React components using dynamic imports.
 * This ensures tenant sites render identically to template previews.
 */
"use client";

import dynamic from "next/dynamic";

// =============================================================================
// DYNAMIC IMPORTS - Same components as template preview
// =============================================================================

// Structural Components
const Header = dynamic(() => import("../../[domain]/sections/Header"), { ssr: true });
const Footer = dynamic(() => import("../../[domain]/sections/Footer"), { ssr: true });

// Hero Variants
const Hero = dynamic(() => import("../../[domain]/sections/Hero"), { ssr: true });

// Grid/Services
const Grid = dynamic(() => import("../../[domain]/sections/Grid"), { ssr: true });
const ServicesSection = dynamic(() => import("../../[domain]/sections/ServicesSection"), { ssr: true });

// Process/Steps
const Steps = dynamic(() => import("../../[domain]/sections/Steps"), { ssr: true });

// CTA Variants
const CTA = dynamic(() => import("../../[domain]/sections/CTA"), { ssr: true });

// Testimonials
const Testimonials = dynamic(() => import("../../[domain]/sections/Testimonials"), { ssr: true });

// Stats
const StatsBanner = dynamic(() => import("../../[domain]/sections/StatsBanner"), { ssr: true });

// Features
const FeaturesIcons = dynamic(() => import("../../[domain]/sections/FeaturesIcons"), { ssr: true });

// Pricing
const PricingTable = dynamic(() => import("../../[domain]/sections/PricingTable"), { ssr: true });

// FAQ
const FAQAccordion = dynamic(() => import("../../[domain]/sections/FAQAccordion"), { ssr: true });

// =============================================================================
// SECTION TYPE → COMPONENT MAPPING
// =============================================================================

/**
 * Maps any section_type to its corresponding React component.
 * 
 * This mapping MUST match the template preview system exactly.
 * 
 * @param {string} sectionType - The section_type from layout_json
 * @returns {React.Component|null} - The component to render
 */
export default function mapSectionToComponent(sectionType) {
  const componentMap = {
    // ========== STRUCTURAL (Always present) ==========
    header: Header,
    footer: Footer,

    // ========== HERO VARIANTS ==========
    hero: Hero,
    hero_centered: Hero,
    hero_split: Hero,
    hero_fullscreen: Hero,
    hero_video: Hero,

    // ========== GRID/SERVICES VARIANTS ==========
    grid: Grid,
    services: ServicesSection,
    services_grid: Grid,
    services_list: Grid,
    features_grid: Grid,

    // ========== STEPS/PROCESS VARIANTS ==========
    steps: Steps,
    steps_horizontal: Steps,
    steps_vertical: Steps,
    process: Steps,
    how_it_works: Steps,

    // ========== CTA VARIANTS ==========
    cta: CTA,
    cta_banner: CTA,
    cta_split: CTA,
    cta_minimal: CTA,
    call_to_action: CTA,

    // ========== TESTIMONIALS ==========
    testimonials: Testimonials,
    testimonials_carousel: Testimonials,
    testimonials_grid: Testimonials,
    reviews: Testimonials,

    // ========== SPECIALIZED COMPONENTS ==========
    stats_banner: StatsBanner,
    stats: StatsBanner,
    statistics: StatsBanner,

    features_icons: FeaturesIcons,
    features: FeaturesIcons,
    benefits: FeaturesIcons,

    pricing_table: PricingTable,
    pricing: PricingTable,
    plans: PricingTable,

    faq_accordion: FAQAccordion,
    faq: FAQAccordion,
    faqs: FAQAccordion,

    // ========== CONTENT SECTIONS (Use Grid) ==========
    about: Grid,
    about_section: Grid,
    team: Grid,
    team_section: Grid,
    gallery: Grid,
    image_gallery: Grid,
    portfolio: Grid,
    blog_preview: Grid,
    newsletter: Grid,
    contact_form: Grid,
    video_section: Grid,
  };

  return componentMap[sectionType] || null;
}

/**
 * Render a section with its component
 * 
 * @param {Object} section - Section object from layout_json
 * @param {string} lang - Current language for translations
 * @returns {React.Element|null}
 */
export function renderSection(section, lang = "en") {
  const Component = mapSectionToComponent(section.section_type);

  if (!Component) {
    // Return placeholder for unknown sections in development
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          ⚠️ Unknown section type: <code>{section.section_type}</code>
        </div>
      );
    }
    return null;
  }

  return <Component data={section.content} lang={lang} />;
}

/**
 * Get all available section types
 * 
 * @returns {string[]} - Array of section type keys
 */
export function getAvailableSectionTypes() {
  return [
    "header",
    "footer",
    "hero",
    "grid",
    "services",
    "steps",
    "cta",
    "cta_banner",
    "testimonials",
    "stats_banner",
    "features_icons",
    "pricing_table",
    "faq_accordion",
  ];
}
