// "use client";

// import dynamic from "next/dynamic";

// /**
//  * ============================================================================
//  * SECTION TYPE → COMPONENT MAPPING
//  * ============================================================================
//  * 
//  * SINGLE SOURCE OF TRUTH for mapping section_type strings to React components.
//  * 
//  * Used by:
//  *   - LayoutRenderer (shared)
//  *   - Website builder (editor)
//  *   - Any code that needs to render a section
//  * 
//  * To add a new section type:
//  *   1. Create component in ../sections/
//  *   2. Add mapping here
//  *   3. Done! Works everywhere automatically.
//  * 
//  * ============================================================================
//  */

// // Dynamic imports for code splitting
// const Hero = dynamic(() => import("../sections/Hero"));
// const Header = dynamic(() => import("../sections/Header"));
// const Footer = dynamic(() => import("../sections/Footer"));
// const ServicesSection = dynamic(() => import("../sections/ServicesSection"));
// const CTA = dynamic(() => import("../sections/CTA"));
// const Testimonials = dynamic(() => import("../sections/Testimonials"));
// const Grid = dynamic(() => import("../sections/Grid"));
// const StatsBanner = dynamic(() => import("../sections/StatsBanner"));
// const FeaturesIcons = dynamic(() => import("../sections/FeaturesIcons"));
// const PricingTable = dynamic(() => import("../sections/PricingTable"));
// const FAQAccordion = dynamic(() => import("../sections/FAQAccordion"));
// const Steps = dynamic(() => import("../sections/Steps"));
// const AboutSection = dynamic(() => import("../sections/AboutSection"), { ssr: true });
// const Gallery = dynamic(() => import("../sections/Gallery"), { ssr: true });
// const Team = dynamic(() => import("../sections/Team"), { ssr: true });



// /**
//  * Maps section_type to component
//  * @param {string} sectionType - The section_type from layout JSON
//  * @returns {React.Component|null} - Component or null if not found
//  */
// export default function mapSectionToComponent(sectionType) {
//   const componentMap = {
//     // ========== STRUCTURAL ==========
//     header: Header,
//     footer: Footer,

//     // ========== HERO VARIANTS ==========
//     hero: Hero,
//     hero_centered: Hero,
//     hero_split: Hero,
//     hero_fullscreen: Hero,
//     hero_minimal: Hero,

//     // ========== SERVICES ==========
//     services: ServicesSection,
//     services_cards: ServicesSection,
//     services_icons: ServicesSection,
//     services_grid: ServicesSection,

//     // ========== CTA VARIANTS ==========
//     cta: CTA,
//     cta_banner: CTA,
//     cta_split: CTA,

//     // ========== TESTIMONIALS ==========
//     testimonials: Testimonials,
//     testimonials_carousel: Testimonials,
//     testimonials_grid: Testimonials,

//     // ========== GRID LAYOUTS ==========
//     grid: Grid,
//     grid_cards: Grid,
//     grid_icons: Grid,

//     // ========== SPECIALIZED ==========
//     stats_banner: StatsBanner,
//     features_icons: FeaturesIcons,
//     pricing_table: PricingTable,
//     faq_accordion: FAQAccordion,
//     steps: Steps,
//     steps_horizontal: Steps,
//     steps_vertical: Steps,

//     // ========== ✅ CUSTOM SECTIONS (Previously unused) ==========
//     about: AboutSection,
//     about_section: AboutSection,
//     about_us: AboutSection,
//     text_block: AboutSection,


//     gallery: Gallery,
//     image_gallery: Gallery,
//     portfolio: Gallery,

//     team: Team,
//     team_section: Team,
//     our_team: Team,
//   };

//   return componentMap[sectionType] || null;
// }


/**
 * Section map (template preview)
 * Re-exports the domain map — single source of truth.
 */
export { default } from "../../[domain]/utils/mapSectionToComponent";