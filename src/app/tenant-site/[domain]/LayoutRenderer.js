"use client";

import React from "react";
import mapSectionToComponent from "./utils/mapSectionToComponent";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { resolveTranslatedContent } from "./utils/resolveTranslated";
import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
export default function LayoutRenderer({
  sections = [],
  template = {},
  theme = {},
  site = {},
  rtlEnabled = false,

}) {

  // console.log("site received site:", site);

  const { language, isRTL } = useTenantLang();
  const themeConfig = useTenantTheme();
  // console.log("Rendering Layout with sections:", sections, site);
  // Separate structural sections
  const headerSection = sections.find((s) => s.section_type === "header");
  const heroSection = sections.find((s) => s.section_type === "hero");
  const footerSection = sections.find((s) => s.section_type === "footer");

  // Get content sections (excluding header, hero, footer)
  const contentSections = sections
    .filter(
      (s) =>
        s.section_type !== "header" &&
        s.section_type !== "hero" &&
        s.section_type !== "footer"
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Get structural components
  const HeaderComponent = headerSection ? mapSectionToComponent("header") : null;
  const HeroComponent = heroSection ? mapSectionToComponent("hero") : null;
  const FooterComponent = footerSection ? mapSectionToComponent("footer") : null;

  return (
    <div className="tenant-site-layout" dir={isRTL ? "rtl" : "ltr"}>
      {/* ================= HEADER ================= */}
      {HeaderComponent && headerSection && (
        <HeaderComponent
          data={resolveTranslatedContent(mapHeaderData(headerSection.content,site), language)}
          lang={language}
          theme={themeConfig}
        />
      )}

      {/* ================= HERO ================= */}
      {HeroComponent && heroSection && (
        <section className="relative">
          <HeroComponent
            data={resolveTranslatedContent(mapHeroData(heroSection.content), language)}
            lang={language}
            theme={themeConfig}
          />
        </section>
      )}

      {/* ================= CONTENT SECTIONS ================= */}
        {/* {contentSections.length === 0 && !heroSection && ( */}

      <main>
         {contentSections.length === 0 && !heroSection && !headerSection && !footerSection && (
          <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <p className="text-gray-500">No content sections configured yet.</p>
            </div>
          </div>
        )}

        {contentSections.map((section, idx) => (
          <SectionRenderer
            key={section.id || idx}
            section={section}
            language={language}
            themeConfig={themeConfig}
            site={site}
          />
        ))}
      </main>

      {/* ================= FOOTER ================= */}
      {FooterComponent && footerSection && (
        <FooterComponent
          data={resolveTranslatedContent(footerSection.content, language)}
          lang={language}
          theme={themeConfig}
        />
      )}
    </div>
  );
}

// =============================================================================
// SECTION RENDERER - Handles both regular sections AND modules
// =============================================================================

function SectionRenderer({ section, language, themeConfig, site }) {
  const params = useParams();
  // const { activeTenant } = useApp();

  const isModule = section.section_type === "module";
  // console.log("ROUTE PARAMS:", params);

  // Get module_key from section content or directly from section
  const moduleKey = section.module_key || section.content?.module_key;
  
  // Get the component
  const Component = mapSectionToComponent(
    section.section_type,
    isModule ? moduleKey : null
  );

  if (!Component) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm">
          ⚠️ Unknown {isModule ? "module" : "section"}: 
          <code>{isModule ? moduleKey : section.section_type}</code>
        </div>
      );
    }
    return null;
  }

  // ========== HANDLE MODULES ==========
  if (isModule) {
    const moduleSettings = section.settings || section.content?.settings || {};
    
    // 👇 BOOKING SHORTCUT SUPPORT
    const moduleData =
      moduleKey === "booking"
        ? {
            preselected_service_slug: params?.serviceSlug || null,
            booking_id: params?.bookingId || null,
          }
        : {};

    return (
      <section className="section-wrapper module-wrapper">
        <Component
          data = {moduleData}
          settings={moduleSettings}
          // tenantId={activeTenant}
          domain={site?.subdomain || site?.custom_domain}
          lang={language}
          theme={themeConfig}
        />
      </section>
    );
  }

  // ========== HANDLE REGULAR SECTIONS ==========
  let normalizedContent = section.content;

  // Apply normalization based on section type
  switch (section.section_type) {
    case "services":
      normalizedContent = mapServicesSectionData(section.content);
      break;
    case "stats_banner":
      normalizedContent = mapStatsBannerData(section.content);
      break;
    case "about":
    case "about_section":
      normalizedContent = mapAboutData(section.content);
      break;
    case "team":
    case "team_section":
      normalizedContent = mapTeamData(section.content);
      break;
    case "gallery":
    case "image_gallery":
      normalizedContent = mapGalleryData(section.content);
      break;
    case "contact":
    case "contact_form":
      normalizedContent = mapContactFormData(section.content);
      break;
    default:
      normalizedContent = section.content;
  }

  const resolvedContent = resolveTranslatedContent(normalizedContent, language);

  return (
    <section className="section-wrapper">
      <Component
        data={resolvedContent}
        lang={language}
        theme={themeConfig}
        domain={site?.subdomain || site?.custom_domain}
      />
    </section>
  );
}

// =============================================================================
// DATA NORMALIZATION FUNCTIONS
// =============================================================================

export function mapHeaderData(raw, site) {
  if (!raw) return {};
  return {
    variant: raw.variant || "default",
    logo_url: raw.logo?.image_url || site?.tenant_logo || null,
    logo_text: raw.logo?.text || null,
    navigation: raw.nav_links || [],
    cta_button: raw.cta_button?.text || null,
    cta_url: raw.cta_button?.url || "#",
    background: raw.style?.background || "white",
    sticky: raw.style?.sticky ?? true,
  };
}

export function mapHeroData(raw) {
  if (!raw) return {};
  return {
    variant: raw.variant || "centered",
    alignment: raw.alignment || "center",
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    description: raw.description || null,
    background: raw.background || { type: "gradient", value: null },
    overlay_opacity: raw.overlay_opacity ?? 0.5,
    text_color: raw.text_color || "white",
    primary_cta: raw.primary_cta || null,
    secondary_cta: raw.secondary_cta || null,
    features_list: raw.features_list || [],
    trust_badges: raw.trust_badges || [],
    stats: raw.stats || [],
    show_availability: raw.show_availability || false,
    floating_card: raw.floating_card || null,
  };
}

// export function mapServicesSectionData(raw) {
//   if (!raw) return {};

//   return {
//     layout: raw.layout || "cards",
//     title: raw.title || null,
//     subtitle: raw.subtitle || null,
//     columns: raw.columns || 3,

//     services: (raw.services || []).map((s, idx) => ({
//       id: s.id || idx,

//       // translated fields (keep objects for resolver)
//       title: s.title || s.name || null,
//       description: s.description || null,
//       price: s.price || null,
//       delivery: s.delivery || null,

//       // UI helpers
//       icon: s.icon || null,
//       image: s.image || null,
//       category: s.category || null,
//       slug: s.slug || null,
//     })),

//     show_book_button: raw.show_cta ?? true,
//     book_button_text: raw.cta_button?.text || null,
//     book_button_url: raw.cta_button?.url || "#",

//     card_style: raw.card_style || "elevated",
//   };
// }
export function mapServicesSectionData(raw) {
  if (!raw) return {};

  return {
    // header
    title: raw.title || null,
    subtitle: raw.subtitle || null,

    // layout
    layout: raw.layout || "cards",
    columns: raw.columns || 3,
    card_style: raw.card_style || "elevated",

    // MODE SWITCH (🔥 REQUIRED)
    mode: raw.mode || "static",

    // STATIC MODE
    services: raw.services || [],

    // DATABASE MODE
    service_ids: raw.service_ids || [],
    category_filter: raw.category_filter || null,
    service_type_filter: raw.service_type_filter || null,
    featured_only: raw.featured_only || false,
    max_services: raw.max_services || 6,

    // display options
    show_price: raw.show_price !== false,
    show_duration: raw.show_duration !== false,
    show_book_button: raw.show_book_button !== false,
    show_service_type_badge: raw.show_service_type_badge !== false,

    // CTA
    book_button_text: raw.book_button_text || raw.cta_button?.text || null,
    book_button_url: raw.book_button_url || raw.cta_button?.url || "#",
  };
}





export function mapStatsBannerData(raw) {
  if (!raw) return {};
  return {
    background: raw.background || "solid",
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    stats: (raw.stats || []).map((s, idx) => ({
      id: s.id || idx,
      label: s.label || s.title || "",
      value: s.number || s.value || "",
    })),
  };
}

// ✅ NEW: About Section Normalization
export function mapAboutData(raw) {
  if (!raw) return {};
  return {
    variant: raw.variant || "split",
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    content: raw.content || raw.description || null,
    image: raw.image || null,
    highlights: raw.highlights || raw.features || [],
    cta_text: raw.cta_text || raw.cta_button?.text || null,
    cta_link: raw.cta_link || raw.cta_button?.url || "#",
  };
}

// ============================================================
// Team Section Normalization (FINAL)
// ============================================================

export function mapTeamData(raw) {
  if (!raw) return {};

  return {
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    layout: raw.layout || "grid",
    columns: raw.columns || 3,
    show_social: raw.show_social ?? true,

    members: (raw.members || raw.team || []).map((m, idx) => ({
      id: m.id || idx,

      // 🔥 KEEP translated objects
      name: m.name || { en: "", ar: "", ur: "" },
      role: m.role || m.position || m.title || { en: "", ar: "", ur: "" },
      bio: m.bio || m.description || { en: "", ar: "", ur: "" },

      photo: m.photo || m.image || m.avatar || null,

      // 🔥 Social links (optional & future-proof)
      social: {
        linkedin: m.social?.linkedin || "",
        twitter: m.social?.twitter || "",
        website: m.social?.website || "",
      },
    })),
  };
}


// ✅ NEW: Gallery Section Normalization
// ============================================================

export function mapGalleryData(raw) {
  if (!raw) return {};

  const items = raw.items || raw.images || [];

  // 🔥 AUTO-GENERATE FILTERS FROM ITEMS
  const categories = [];
  items.forEach((item) => {
    if (item.category) {
      categories.push(item.category);
    }
  });

  return {
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    layout: raw.layout || "grid",
    columns: raw.columns || 3,
    show_filter: raw.show_filter || false,

    // ✅ AUTO filters (multilingual-safe)
    filter_categories: raw.filter_categories || categories,

    images: items.map((item, idx) => ({
      id: idx,
      src: item.image_url || item.src || "",
      caption: item.title || null,
      category: item.category || null,
      alt: item.title || "",
    })),
  };
}



// ✅ NEW: Contact Form Section Normalization
export function mapContactFormData(raw) {
  if (!raw) return {};
  return {
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    show_map: raw.show_map ?? false,
    map_embed: raw.map_embed || null,
    show_contact_info: raw.show_contact_info ?? true,
    contact_info: raw.contact_info || {},
    fields: raw.fields || ["name", "email", "phone", "message"],
    submit_text: raw.submit_text || raw.submit_button || "Send Message",
    success_message: raw.success_message || "Thank you! We'll get back to you soon.",
  };
}
