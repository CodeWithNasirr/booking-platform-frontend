/**
 * mapSectionToComponent.js
 * 
 * Maps section_type to React components using dynamic imports.
 * Handles both regular sections AND modules.
 */
"use client";

import dynamic from "next/dynamic";

// =============================================================================
// DYNAMIC IMPORTS - Section Components
// =============================================================================

// Structural
const Header = dynamic(() => import("../sections/Header"), { ssr: true });
const Footer = dynamic(() => import("../sections/Footer"), { ssr: true });

// Hero
const Hero = dynamic(() => import("../sections/Hero"), { ssr: true });

// Content Sections
const Grid = dynamic(() => import("../sections/Grid"), { ssr: true });
const ServicesSection = dynamic(() => import("../sections/ServicesSection"), { ssr: true });
const Steps = dynamic(() => import("../sections/Steps"), { ssr: true });
const CTA = dynamic(() => import("../sections/CTA"), { ssr: true });
const Testimonials = dynamic(() => import("../sections/Testimonials"), { ssr: true });
const StatsBanner = dynamic(() => import("../sections/StatsBanner"), { ssr: true });
const FeaturesIcons = dynamic(() => import("../sections/FeaturesIcons"), { ssr: true });
const PricingTable = dynamic(() => import("../sections/PricingTable"), { ssr: true });
const FAQAccordion = dynamic(() => import("../sections/FAQAccordion"), { ssr: true });

// ✅ Previously unused - now properly mapped
const AboutSection = dynamic(() => import("../sections/AboutSection"), { ssr: true });
const ContactForm = dynamic(() => import("../sections/ContactForm"), { ssr: true });
const Gallery = dynamic(() => import("../sections/Gallery"), { ssr: true });
const Team = dynamic(() => import("../sections/Team"), { ssr: true });


const OrderCheckoutModule = dynamic(() => import("../../modules/OrderCheckout"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="order_checkout" />
});

const OrderDashboardModule = dynamic(() => import("../../modules/CustomerOrdersDashboard"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="order_dashboard" />
});

// const ProviderOrdersModule = dynamic(() => import("../../modules/ProviderOrdersDashboard"), { 
//   ssr: false,
//   loading: () => <ModulePlaceholder type="provider_orders" />
// });

// =============================================================================
// DYNAMIC IMPORTS - Module Components (client-side only)
// =============================================================================

const BookingModule = dynamic(() => import("../../modules/BookingModule"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="booking" />
});

const ChatModule = dynamic(() => import("../../modules/ChatModule"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="chat" />
});

const PaymentModule = dynamic(() => import("../../modules/PaymentModule"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="payment" />
});

const VideoCallModule = dynamic(() => import("../../modules/VideoCallModule"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="video_call" />
});

const FileUploadModule = dynamic(() => import("../../modules/FileUploadModule"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="file_upload" />
});

const ContactFormModule = dynamic(() => import("../../modules/ContactFormModule"), { 
  ssr: false,
  loading: () => <ModulePlaceholder type="contact_form" />
});

// =============================================================================
// PLACEHOLDER COMPONENT
// =============================================================================

function ModulePlaceholder({ type }) {
  const placeholders = {
    booking: { height: "h-96", icon: "📅", label: "Loading Booking..." },
    chat: { height: "h-16 w-16", icon: "💬", label: "" },
    payment: { height: "h-20", icon: "💳", label: "Loading Payment..." },
    video_call: { height: "h-12", icon: "📹", label: "" },
    file_upload: { height: "h-32", icon: "📁", label: "Loading..." },
    contact_form: { height: "h-64", icon: "✉️", label: "Loading Form..." },
    order_checkout: { height: "h-96", icon: "🛒", label: "Loading Checkout..." },
    order_dashboard: { height: "h-96", icon: "📦", label: "Loading Orders..." },
    // provider_orders: { height: "h-96", icon: "📋", label: "Loading Orders..." },

  };
  
  const config = placeholders[type] || { height: "h-32", icon: "⏳", label: "Loading..." };
  
  return (
    <div className={`${config.height} bg-gray-100 rounded-xl animate-pulse flex items-center justify-center`}>
      <div className="text-center text-gray-400">
        <span className="text-2xl">{config.icon}</span>
        {config.label && <p className="text-sm mt-2">{config.label}</p>}
      </div>
    </div>
  );
}

// =============================================================================
// SECTION TYPE → COMPONENT MAPPING
// =============================================================================

const SECTION_MAP = {
  // ========== STRUCTURAL ==========
  header: Header,
  footer: Footer,

  // ========== HERO VARIANTS ==========
  hero: Hero,
  hero_centered: Hero,
  hero_split: Hero,
  hero_fullscreen: Hero,
  hero_video: Hero,

  // ========== GRID/SERVICES ==========
  grid: Grid,
  services: ServicesSection,
  services_grid: ServicesSection,
  services_list: ServicesSection,
  features_grid: Grid,

  // ========== STEPS/PROCESS ==========
  steps: Steps,
  steps_horizontal: Steps,
  steps_vertical: Steps,
  process: Steps,
  how_it_works: Steps,

  // ========== CTA ==========
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

  // ========== STATS ==========
  stats_banner: StatsBanner,
  stats: StatsBanner,
  statistics: StatsBanner,

  // ========== FEATURES ==========
  features_icons: FeaturesIcons,
  features: FeaturesIcons,
  benefits: FeaturesIcons,

  // ========== PRICING ==========
  pricing_table: PricingTable,
  pricing: PricingTable,
  plans: PricingTable,

  // ========== FAQ ==========
  faq_accordion: FAQAccordion,
  faq: FAQAccordion,
  faqs: FAQAccordion,

  // ========== ✅ CUSTOM SECTIONS (Previously unused) ==========
  about: AboutSection,
  about_section: AboutSection,
  about_us: AboutSection,
  text_block: AboutSection,
  
  contact: ContactForm,
  contact_form: ContactForm,
  contact_section: ContactForm,
  
  gallery: Gallery,
  image_gallery: Gallery,
  portfolio: Gallery,
  
  team: Team,
  team_section: Team,
  our_team: Team,

  // ========== GENERIC FALLBACKS ==========
  blog_preview: Grid,
  newsletter: Grid,
  video_section: Grid,
};

// =============================================================================
// MODULE KEY → COMPONENT MAPPING
// =============================================================================

const MODULE_MAP = {
  booking: BookingModule,
  chat: ChatModule,
  payment: PaymentModule,
  video_call: VideoCallModule,
  file_upload: FileUploadModule,
  contact_form: ContactFormModule,
  order_checkout: OrderCheckoutModule,
  order_dashboard: OrderDashboardModule,
  // provider_orders: ProviderOrdersModule,
};

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Maps section_type (and optionally module_key) to React component
 * 
 * @param {string} sectionType - The section_type from layout_json
 * @param {string} moduleKey - Optional module_key for module sections
 * @returns {React.Component|null}
 */
export default function mapSectionToComponent(sectionType, moduleKey = null) {
  // Handle module sections
  if (sectionType === "module" && moduleKey) {
    const ModuleComponent = MODULE_MAP[moduleKey];
    if (ModuleComponent) {
      return ModuleComponent;
    }
    console.warn(`Unknown module_key: ${moduleKey}`);
    return null;
  }

  // Handle regular sections
  const Component = SECTION_MAP[sectionType];
  if (Component) {
    return Component;
  }

  console.warn(`Unknown section_type: ${sectionType}`);
  return null;
}

// =============================================================================
// HELPER EXPORTS
// =============================================================================

export function getAvailableSectionTypes() {
  return Object.keys(SECTION_MAP);
}

export function getAvailableModuleTypes() {
  return Object.keys(MODULE_MAP);
}

export { SECTION_MAP, MODULE_MAP };

