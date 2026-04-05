// app/tenant-site/utils/map.
"use client";
import dynamic from "next/dynamic";

const Hero = dynamic(() => import("../sections/Hero"));
const Grid = dynamic(() => import("../sections/Grid"));
const Steps = dynamic(() => import("../sections/Steps"));
const CTA = dynamic(() => import("../sections/CTA"));
const Testimonials = dynamic(() => import("../sections/Testimonials"));
const Header = dynamic(() => import("../sections/Header"));
const Footer = dynamic(() => import("../sections/Footer"));


// NEW components required by your JSON
const StatsBanner = dynamic(() => import("../sections/StatsBanner"));
const FeaturesIcons = dynamic(() => import("../sections/FeaturesIcons"));
const PricingTable = dynamic(() => import("../sections/PricingTable"));
const FAQAccordion = dynamic(() => import("../sections/FAQAccordion"));
const ServicesSection = dynamic(() => import("../sections/ServicesSection"));

/**
 * UNIVERSAL MAPPING SYSTEM
 * 
 * Maps any section_type to its universal wrapper component.
 * The wrapper then handles all variants internally.
 * 
 * To add NEW section types:
 * 1. Map section_type to existing wrapper (if pattern matches)
 * 2. OR create new universal wrapper (if new pattern)
 * 3. Add to this map
 * 4. Done! No other changes needed.
 */
export default function mapSectionToComponent(sectionType) {

  const componentMap = {
    // ========== STRUCTURAL (Always present) ==========
    header: Header,
    
    footer: Footer,


    // // ========== HERO VARIANTS (All use Hero wrapper) ==========
    hero: Hero,
   
    // // ========== GRID VARIANTS (All use Grid wrapper) ==========
    // grid: Grid,
    services:ServicesSection,

  
    // // ========== STEPS/PROCESS VARIANTS (All use Steps wrapper) ==========
    // steps: Steps,

    // // ========== CTA VARIANTS (All use CTA wrapper) ==========
    cta: CTA,
    cta_banner:CTA,

    // ========== TESTIMONIAL VARIANTS (All use Testimonials wrapper) ==========
    testimonials:Testimonials,
    testimonials_carousel:Testimonials,

    // // ========== SPECIALIZED (Can be added as needed) ==========
    // contact_form: Grid, // Use Grid with contact variant
    // blog_preview: Grid, // Use Grid with blog variant
    // newsletter: Grid,   // Use Grid with newsletter variant
    // video_section: Grid, // Use Grid with video variant
    // image_gallery: Grid, // Use Grid with gallery variant




    // // SPECIALIZED COMPONENTS (from your JSON)
    stats_banner: StatsBanner,          // FIXED
    features_icons: FeaturesIcons,      // FIXED
    pricing_table: PricingTable,        // FIXED
    faq_accordion: FAQAccordion,        // FIXED


  };

  return componentMap[sectionType] || null;
}