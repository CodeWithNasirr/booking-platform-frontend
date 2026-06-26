// ============================================================
// WEBSITE BUILDER API FUNCTIONS
// Handles loading/saving layouts, pages, and theme configs
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get auth headers with tenant token
 */
function getHeaders(tenantId) {
  const token = typeof window !== "undefined" 
    ? document.cookie.match(/access_token=([^;]+)/)?.[1]
    : null;

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(tenantId && { "X-Tenant": tenantId }),
  };
}

// ============================================================
// TEMPLATES API
// ============================================================

/**
 * Fetch all available templates
 */
export async function fetchTemplates() {
  const res = await fetch(`${API_URL}/api/v1/website/templates/`, {
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error("Failed to fetch templates");
  }

  const data = await res.json();
  return data.results || data || [];
}

/**
 * Fetch single template details with layouts
 */
export async function fetchTemplate(slug) {
  const res = await fetch(`${API_URL}/api/v1/website/templates/${slug}/`, {
    headers: getHeaders(),
    credentials: 'include',

  });

  if (!res.ok) {
    throw new Error(`Failed to fetch template: ${slug}`);
  }

  return res.json();
}

/**
 * Fetch specific layout for a template
 */
export async function fetchTemplateLayout(slug, layoutId) {
  const res = await fetch(
    `${API_URL}/api/v1/website/templates/${slug}/layouts/${layoutId}/`,
    { headers: getHeaders(), credentials: 'include' }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch layout: ${layoutId}`);
  }

  return res.json();
}

// ============================================================
// TENANT SITE API
// ============================================================

/**
 * Fetch tenant's current site configuration
 */
export async function fetchTenantSite(tenantId) {
  const res = await fetch(`${API_URL}/api/v1/website/site/`, {
    headers: getHeaders(tenantId),
    credentials: 'include',

  });

  if (!res.ok) {
    throw new Error("Failed to fetch tenant site");
  }

  return res.json();
}

/**
 * Fetch tenant's current layout
 */
export async function fetchTenantLayout(tenantId) {
  const res = await fetch(`${API_URL}/api/v1/website/layout/`, {
    headers: getHeaders(tenantId),
    credentials: 'include',

  });

  if (!res.ok) {
    throw new Error("Failed to fetch tenant layout");
  }

  return res.json();
}

/**
 * Save tenant's layout (sections array)
 */
export async function saveTenantLayout(tenantId, layoutData) {
  const res = await fetch(`${API_URL}/api/v1/website/layout/`, {
    method: "PATCH",
    headers: getHeaders(tenantId),
    credentials: 'include',

    body: JSON.stringify({
      layout_json: {
        sections: layoutData.sections,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to save layout");
  }

  return res.json();
}

/**
 * Save tenant's theme configuration
 */
export async function saveTenantTheme(tenantId, themeConfig) {
  const res = await fetch(`${API_URL}/api/v1/website/site/theme/`, {
    method: "PATCH",
    headers: getHeaders(tenantId),
    credentials: 'include',

    body: JSON.stringify({
      theme_config: themeConfig,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to save theme");
  }

  return res.json();
}

/**
 * Save both layout and theme at once (BULK SAVE)
 * This is the primary save function used by the editor
 */
export async function saveTenantSiteConfig(tenantId, config) {
  const { sections, theme_config, themeConfig, pages } = config;
  
  // Use the bulk save endpoint if available
  const res = await fetch(`${API_URL}/api/v1/website/save/`, {
    method: "POST",
    headers: getHeaders(tenantId),
    credentials: 'include',

    body: JSON.stringify({
      sections: sections || [],
      theme_config: theme_config || themeConfig || {},
      pages: pages || [],
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    
    // Fallback to individual saves if bulk endpoint fails
    if (res.status === 404) {
      console.warn("Bulk save endpoint not found, falling back to individual saves");
      return saveTenantSiteConfigFallback(tenantId, config);
    }
    
    throw new Error(error.detail || "Failed to save site configuration");
  }

  return res.json();
}

/**
 * Fallback save method - saves sections, theme, and pages individually
 */
async function saveTenantSiteConfigFallback(tenantId, config) {
  const { sections, theme_config, themeConfig, pages } = config;

  const promises = [];

  // Save layout (sections)
  if (sections) {
    promises.push(saveTenantLayout(tenantId, { sections }));
  }

  // Save theme
  if (theme_config || themeConfig) {
    promises.push(saveTenantTheme(tenantId, theme_config || themeConfig));
  }

  // Save pages
  if (pages && pages.length > 0) {
    promises.push(saveTenantPages(tenantId, pages));
  }

  const results = await Promise.allSettled(promises);

  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason?.message);

  if (errors.length > 0) {
    throw new Error(`Partial save failed: ${errors.join(", ")}`);
  }

  return {
    layout: results[0]?.value,
    theme: results[1]?.value,
    pages: results[2]?.value,
  };
}

// ============================================================
// TENANT SITE FULL API (Optimized)
// ============================================================

/**
 * Fetch everything for the builder in one request
 */
export async function fetchTenantSiteFull(domain) {
  if (!domain) throw new Error("No domain provided");

  const res = await fetch(
    `${API_URL}/api/v1/website/tenant/${domain}/full/`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch site configuration");
  }

  return res.json();
}

// ============================================================
// PAGES API
// ============================================================

/**
 * Fetch all pages for tenant site
 */
export async function fetchTenantPages(tenantId) {
  const res = await fetch(`${API_URL}/api/v1/website/pages/`, {
    headers: getHeaders(tenantId),
    credentials: 'include',

  });

  if (!res.ok) {
    throw new Error("Failed to fetch pages");
  }

  const data = await res.json();
  return data.results || data || [];
}

/**
 * Create a new page
 */
export async function createTenantPage(tenantId, pageData) {
  const res = await fetch(`${API_URL}/api/v1/website/pages/`, {
    method: "POST",
    headers: getHeaders(tenantId),
    credentials: 'include',

    body: JSON.stringify(pageData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create page");
  }

  return res.json();
}

/**
 * Update a page
 */
export async function updateTenantPage(tenantId, pageId, pageData) {
  const res = await fetch(`${API_URL}/api/v1/website/pages/${pageId}/`, {
    method: "PATCH",
    headers: getHeaders(tenantId),
    credentials: 'include',

    body: JSON.stringify(pageData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to update page");
  }

  return res.json();
}

/**
 * Delete a page
 */
export async function deleteTenantPage(tenantId, pageId) {
  const res = await fetch(`${API_URL}/api/v1/website/pages/${pageId}/`, {
    method: "DELETE",
    headers: getHeaders(tenantId),
    credentials: 'include',

  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to delete page");
  }

  return { success: true };
}

/**
 * Bulk save/update pages
 * Creates new pages and updates existing ones
 */
export async function saveTenantPages(tenantId, pages) {
  // Try bulk endpoint first
  const res = await fetch(`${API_URL}/api/v1/website/pages/bulk/`, {
    method: "POST",
    headers: getHeaders(tenantId),
    body: JSON.stringify({ pages }),
    credentials: 'include',

  });

  if (res.ok) {
    return res.json();
  }

  // Fallback: Save pages individually
  console.warn("Bulk pages endpoint not found, saving individually");
  
  const results = await Promise.allSettled(
    pages.map(async (page) => {
      // Check if page has a server ID (not just local UUID)
      const isExisting = page.server_id || (page.id && !page.id.includes("-")); // UUID vs server ID
      
      if (isExisting) {
        return updateTenantPage(tenantId, page.server_id || page.id, page);
      } else {
        return createTenantPage(tenantId, page);
      }
    })
  );

  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason?.message);

  if (errors.length > 0) {
    console.error("Some pages failed to save:", errors);
  }

  return {
    saved: results.filter((r) => r.status === "fulfilled").length,
    failed: errors.length,
    errors,
  };
}

/**
 * Reorder pages
 */
export async function reorderTenantPages(tenantId, pageOrder) {
  const res = await fetch(`${API_URL}/api/v1/website/pages/reorder/`, {
    method: "POST",
    headers: getHeaders(tenantId),
    credentials: 'include',

    body: JSON.stringify({ order: pageOrder }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to reorder pages");
  }

  return res.json();
}

// ============================================================
// SECTION BLOCKS LIBRARY
// ============================================================

/**
 * Get available section block presets
 */
export function getSectionPresets() {
  return [
    // Structural
    {
      category: "structural",
      blocks: [
        {
          type: "header",
          name: { en: "Header", ar: "الرأس", ur: "ہیڈر" },
          icon: "📌",
          description: { en: "Navigation header with logo and menu", ar: "رأس التنقل مع الشعار والقائمة", ur: "لوگو اور مینو کے ساتھ نیویگیشن ہیڈر" },
          defaultContent: {
            logo: { text: { en: "Your Brand", ar: "علامتك التجارية", ur: "آپ کا برانڈ" } },
            nav_links: [],
            cta_button: { text: { en: "Book Now", ar: "احجز الآن", ur: "ابھی بک کریں" }, url: "/book" },
            style: { background: "white", sticky: true },
          },
        },
        {
          type: "footer",
          name: { en: "Footer", ar: "التذييل", ur: "فوٹر" },
          icon: "📋",
          description: { en: "Page footer with links and contact info", ar: "تذييل الصفحة مع الروابط ومعلومات الاتصال", ur: "لنکس اور رابطہ کی معلومات کے ساتھ پیج فوٹر" },
          defaultContent: {
            variant: "multi_column",
            background: "dark",
            business_name: { en: "Your Business", ar: "عملك", ur: "آپ کا کاروبار" },
            columns: [],
            social_links: [],
          },
        },
      ],
    },

    // Hero Sections
    {
      category: "hero",
      blocks: [
        {
          type: "hero",
          variant: "centered",
          name: { en: "Hero - Centered", ar: "البطل - مركز", ur: "ہیرو - مرکزی" },
          icon: "🎯",
          description: { en: "Full-width hero with centered content", ar: "بطل كامل العرض مع محتوى مركزي", ur: "مرکزی مواد کے ساتھ مکمل چوڑائی کا ہیرو" },
          defaultContent: {
            variant: "centered",
            title: { en: "Your Headline Here", ar: "عنوانك هنا", ur: "آپ کی سرخی یہاں" },
            subtitle: { en: "Add your compelling subtitle", ar: "أضف عنوانك الفرعي الجذاب", ur: "اپنی دلچسپ ذیلی سرخی شامل کریں" },
            primary_cta: { text: { en: "Get Started", ar: "ابدأ", ur: "شروع کریں" }, url: "#" },
            background: { type: "gradient" },
            text_color: "white",
          },
        },
        {
          type: "hero",
          variant: "split",
          name: { en: "Hero - Split", ar: "البطل - منقسم", ur: "ہیرو - منقسم" },
          icon: "⬜",
          description: { en: "Two-column hero with text and image", ar: "بطل عمودين مع نص وصورة", ur: "ٹیکسٹ اور تصویر کے ساتھ دو کالم ہیرو" },
          defaultContent: {
            variant: "split",
            title: { en: "Your Headline Here", ar: "عنوانك هنا", ur: "آپ کی سرخی یہاں" },
            subtitle: { en: "Add your description", ar: "أضف وصفك", ur: "اپنی تفصیل شامل کریں" },
            image: "/placeholder-hero.jpg",
            alignment: "left",
            primary_cta: { text: { en: "Learn More", ar: "تعلم المزيد", ur: "مزید جانیں" }, url: "#" },
          },
        },
        {
          type: "hero",
          variant: "video",
          name: { en: "Hero - Video Background", ar: "البطل - خلفية فيديو", ur: "ہیرو - ویڈیو بیک گراؤنڈ" },
          icon: "🎬",
          description: { en: "Hero with video background", ar: "بطل مع خلفية فيديو", ur: "ویڈیو بیک گراؤنڈ کے ساتھ ہیرو" },
          defaultContent: {
            variant: "video",
            title: { en: "Your Headline Here", ar: "عنوانك هنا", ur: "آپ کی سرخی یہاں" },
            subtitle: { en: "Add your description", ar: "أضف وصفك", ur: "اپنی تفصیل شامل کریں" },
            video_url: "",
            overlay_opacity: 0.5,
            primary_cta: { text: { en: "Get Started", ar: "ابدأ", ur: "شروع کریں" }, url: "#" },
          },
        },
      ],
    },

    // Content Sections
    {
      category: "content",
      blocks: [
        {
          type: "services",
          name: { en: "Services", ar: "الخدمات", ur: "خدمات" },
          icon: "🏷️",
          description: { en: "Showcase your services in a grid", ar: "اعرض خدماتك في شبكة", ur: "اپنی خدمات کو گرڈ میں دکھائیں" },
          defaultContent: {
            title: { en: "Our Services", ar: "خدماتنا", ur: "ہماری خدمات" },
            subtitle: { en: "What we offer", ar: "ما نقدمه", ur: "ہم کیا پیش کرتے ہیں" },
            columns: 3,
            layout: "cards",
            services: [],
          },
        },
        {
          type: "features_icons",
          name: { en: "Features", ar: "الميزات", ur: "خصوصیات" },
          icon: "✨",
          description: { en: "Feature grid with icons", ar: "شبكة الميزات مع الأيقونات", ur: "آئیکنز کے ساتھ فیچر گرڈ" },
          defaultContent: {
            title: { en: "Why Choose Us", ar: "لماذا تختارنا", ur: "ہمیں کیوں منتخب کریں" },
            layout: "icons_4col",
            items: [],
          },
        },
        {
          type: "testimonials",
          name: { en: "Testimonials", ar: "الشهادات", ur: "تعریفیں" },
          icon: "⭐",
          description: { en: "Customer reviews and testimonials", ar: "مراجعات العملاء والشهادات", ur: "کسٹمر ریویوز اور تعریفیں" },
          defaultContent: {
            title: { en: "What Our Clients Say", ar: "ماذا يقول عملاؤنا", ur: "ہمارے کلائنٹس کیا کہتے ہیں" },
            show_photos: true,
            show_ratings: true,
            testimonials: [],
          },
        },
        // {
        //   type: "pricing_table",
        //   name: { en: "Pricing Table", ar: "جدول الأسعار", ur: "قیمتوں کی میز" },
        //   icon: "💰",
        //   description: { en: "Display pricing plans", ar: "عرض خطط الأسعار", ur: "قیمتوں کے پلانز دکھائیں" },
        //   defaultContent: {
        //     title: { en: "Pricing Plans", ar: "خطط الأسعار", ur: "قیمتوں کے پلانز" },
        //     billing_toggle: true,
        //     plans: [],
        //   },
        // },
        {
          type: "faq_accordion",
          name: { en: "FAQ", ar: "الأسئلة الشائعة", ur: "عمومی سوالات" },
          icon: "❓",
          description: { en: "Frequently asked questions accordion", ar: "الأسئلة الشائعة بنمط الأكورديون", ur: "اکثر پوچھے جانے والے سوالات اکارڈین" },
          defaultContent: {
            title: { en: "Frequently Asked Questions", ar: "الأسئلة الشائعة", ur: "اکثر پوچھے جانے والے سوالات" },
            layout: "two_column",
            faqs: [],
          },
        },
        {
          type: "stats_banner",
          name: { en: "Stats Banner", ar: "شريط الإحصائيات", ur: "اعداد و شمار بینر" },
          icon: "📊",
          description: { en: "Display key statistics", ar: "عرض الإحصائيات الرئيسية", ur: "کلیدی اعدادوشمار دکھائیں" },
          defaultContent: {
            background: "gradient",
            stats: [
              { number: "500+", label: { en: "Clients", ar: "العملاء", ur: "کلائنٹس" } },
              { number: "98%", label: { en: "Satisfaction", ar: "الرضا", ur: "اطمینان" } },
            ],
          },
        },
        {
          type: "gallery",
          name: { en: "Gallery", ar: "معرض الصور", ur: "گیلری" },
          icon: "🖼️",
          description: { en: "Image gallery with filtering", ar: "معرض صور مع التصفية", ur: "فلٹرنگ کے ساتھ امیج گیلری" },
          defaultContent: {
            title: { en: "Our Gallery", ar: "معرضنا", ur: "ہماری گیلری" },
            layout: "masonry",
            columns: 3,
            show_filter: true,
            items: [],
          },
        },
        {
          type: "grid",
          name: { en: "Grid", ar: "شبكة", ur: "گرڈ" },
          icon: "🧱",
          description: { en: "Flexible content grid", ar: "شبكة محتوى مرنة", ur: "لچکدار مواد گرڈ" },
          defaultContent: {
            title: { en: "What We Offer", ar: "ماذا نقدم", ur: "ہم کیا پیش کرتے ہیں" },
            columns: 3,
            variant: "cards",
            items: [],
          },
        },
        {
          type: "steps",
          name: { en: "Process Steps", ar: "خطوات العملية", ur: "عمل کے مراحل" },
          icon: "📍",
          description: { en: "Show how it works steps", ar: "أظهر خطوات كيفية العمل", ur: "کیسے کام کرتا ہے کے مراحل دکھائیں" },
          defaultContent: {
            title: { en: "How It Works", ar: "كيف يعمل", ur: "یہ کیسے کام کرتا ہے" },
            layout: "horizontal",
            steps: [
              { number: "1", title: { en: "Step 1", ar: "الخطوة 1", ur: "مرحلہ 1" }, description: { en: "Description", ar: "الوصف", ur: "تفصیل" } },
              { number: "2", title: { en: "Step 2", ar: "الخطوة 2", ur: "مرحلہ 2" }, description: { en: "Description", ar: "الوصف", ur: "تفصیل" } },
              { number: "3", title: { en: "Step 3", ar: "الخطوة 3", ur: "مرحلہ 3" }, description: { en: "Description", ar: "الوصف", ur: "تفصیل" } },
            ],
          },
        },
        {
          type: "team",
          name: { en: "Team Members", ar: "أعضاء الفريق", ur: "ٹیم ممبران" },
          icon: "👥",
          description: { en: "Showcase team members", ar: "عرض أعضاء الفريق", ur: "ٹیم ممبران کی نمائش" },
          defaultContent: {
            title: { en: "Meet Our Team", ar: "تعرف على فريقنا", ur: "ہماری ٹیم سے ملیں" },
            layout: "grid",
            columns: 4,
            members: [],
          },
        },
        {
          type: "text_block",
          name: { en: "Text Block", ar: "كتلة نصية", ur: "ٹیکسٹ بلاک" },
          icon: "📝",
          description: { en: "Rich text content block", ar: "كتلة محتوى نصي غني", ur: "رچ ٹیکسٹ کنٹینٹ بلاک" },
          defaultContent: {
            title: { en: "Section Title", ar: "عنوان القسم", ur: "سیکشن کا عنوان" },
            content: { 
              en: "Add your content here...", 
              ar: "أضف محتواك هنا...", 
              ur: "اپنا مواد یہاں شامل کریں..." 
            },
            alignment: "left",
          },
        },
      ],
    },

    // CTA Sections
    {
      category: "cta",
      blocks: [
        {
          type: "cta",
          variant: "banner",
          name: { en: "CTA Banner", ar: "شريط الدعوة للعمل", ur: "سی ٹی اے بینر" },
          icon: "📢",
          description: { en: "Full-width call-to-action banner", ar: "شريط دعوة للعمل كامل العرض", ur: "مکمل چوڑائی کا کال ٹو ایکشن بینر" },
          defaultContent: {
            variant: "banner",
            style: "gradient",
            title: { en: "Ready to Get Started?", ar: "هل أنت مستعد للبدء؟", ur: "شروع کرنے کے لیے تیار ہیں؟" },
            subtitle: { en: "Contact us today", ar: "اتصل بنا اليوم", ur: "آج ہی ہم سے رابطہ کریں" },
            button_label: { en: "Contact Us", ar: "اتصل بنا", ur: "ہم سے رابطہ کریں" },
            button_url: "/contact",
            // ✅ Secondary button (NEW)
            secondary_button: {
              en: "Call Us: +1 (555) 123-4567",
              ar: "اتصل بنا: +1 (555) 123-4567",
              ur: "کال کریں: +1 (555) 123-4567",
            },
            secondary_button_url: "tel:+15551234567",
            text_color: "white",
          },
        },
        {
          type: "cta",
          variant: "split",
          name: { en: "CTA Split", ar: "دعوة للعمل منقسمة", ur: "سی ٹی اے منقسم" },
          icon: "🔀",
          description: { en: "Two-column call-to-action", ar: "دعوة للعمل بعمودين", ur: "دو کالم کال ٹو ایکشن" },
          defaultContent: {
            variant: "split",
            title: { en: "Let's Work Together", ar: "دعنا نعمل معًا", ur: "آئیں مل کر کام کریں" },
            button_label: { en: "Schedule a Call", ar: "حدد مكالمة", ur: "کال شیڈول کریں" },
            button_url: "/book",
          },
        },
        {
          type: "cta",
          variant: "newsletter",
          name: { en: "Newsletter Signup", ar: "الاشتراك في النشرة", ur: "نیوز لیٹر سائن اپ" },
          icon: "✉️",
          description: { en: "Email newsletter subscription", ar: "الاشتراك في النشرة البريدية", ur: "ای میل نیوز لیٹر سبسکرپشن" },
          defaultContent: {
            variant: "newsletter",
            title: { en: "Stay Updated", ar: "ابق على اطلاع", ur: "اپ ڈیٹ رہیں" },
            subtitle: { en: "Subscribe to our newsletter", ar: "اشترك في نشرتنا الإخبارية", ur: "ہماری نیوز لیٹر کو سبسکرائب کریں" },
            placeholder: { en: "Enter your email", ar: "أدخل بريدك الإلكتروني", ur: "اپنا ای میل درج کریں" },
            button_label: { en: "Subscribe", ar: "اشترك", ur: "سبسکرائب کریں" },
          },
        },
      ],
    },

    // Modules (Required for Digital Services)
    {
      category: "modules",
      blocks: getModulePresets(),
    },
  ];
}

/**
 * Get module presets for digital services
 * These are mandatory blocks for digital service providers
 */
export function getModulePresets() {
  return [
    // {
    //   type: "module",
    //   module_type: "chat",
    //   moduleKey: "chat",
    //   name: { en: "Chat Module", ar: "وحدة الدردشة", ur: "چیٹ ماڈیول" },
    //   icon: "💬",
    //   description: { 
    //     en: "Real-time chat communication with clients", 
    //     ar: "التواصل عبر الدردشة في الوقت الفعلي مع العملاء", 
    //     ur: "کلائنٹس کے ساتھ ریئل ٹائم چیٹ مواصلات" 
    //   },
    //   required: true,
    //   defaultContent: {
    //     module_type: "chat",
    //     module_key: "chat",
    //     enabled: true,
    //     settings: {
    //       auto_response: {
    //         enabled: true,
    //         message: { 
    //           en: "Thanks for reaching out! I'll respond within 24 hours.", 
    //           ar: "شكراً للتواصل! سأرد خلال 24 ساعة.",
    //           ur: "رابطہ کرنے کا شکریہ! میں 24 گھنٹوں میں جواب دوں گا۔"
    //         },
    //       },
    //       file_sharing: true,
    //       project_brief_form: true,
    //       response_time: { en: "Usually responds within 24 hours", ar: "يستجيب عادة خلال 24 ساعة", ur: "عام طور پر 24 گھنٹوں میں جواب دیتا ہے" },
    //     },
    //     style: {
    //       position: "bottom-right",
    //       primary_color: "brand",
    //     },
    //   },
    // },
    // {
    //   type: "module",
    //   module_type: "file_upload",
    //   moduleKey: "file_upload",
    //   name: { en: "File Upload", ar: "رفع الملفات", ur: "فائل اپ لوڈ" },
    //   icon: "📁",
    //   description: { 
    //     en: "Secure file exchange with clients", 
    //     ar: "تبادل آمن للملفات مع العملاء", 
    //     ur: "کلائنٹس کے ساتھ محفوظ فائل تبادلہ" 
    //   },
    //   required: true,
    //   defaultContent: {
    //     module_type: "file_upload",
    //     module_key: "file_upload",
    //     enabled: true,
    //     settings: {
    //       max_files: 10,
    //       max_file_size: "50MB",
    //       allowed_types: ["image/*", "application/pdf", ".doc", ".docx", ".xls", ".xlsx"],
    //       preview_enabled: true,
    //     },
    //     labels: {
    //       upload_button: { en: "Upload Files", ar: "رفع الملفات", ur: "فائلیں اپ لوڈ کریں" },
    //       drag_drop: { en: "Drag & drop files here", ar: "اسحب وأفلت الملفات هنا", ur: "فائلیں یہاں ڈریگ اور ڈراپ کریں" },
    //     },
    //   },
    // },
    // {
    //   type: "module",
    //   module_type: "payment",
    //   moduleKey: "payment",
    //   name: { en: "Payment Module", ar: "وحدة الدفع", ur: "پیمنٹ ماڈیول" },
    //   icon: "💳",
    //   description: { 
    //     en: "Secure payment processing", 
    //     ar: "معالجة الدفع الآمنة", 
    //     ur: "محفوظ ادائیگی پروسیسنگ" 
    //   },
    //   required: true,
    //   defaultContent: {
    //     module_type: "payment",
    //     module_key: "payment",
    //     enabled: true,
    //     settings: {
    //       escrow_enabled: true,
    //       milestone_payments: true,
    //       invoice_generation: true,
    //     },
    //     labels: {
    //       pay_button: { en: "Pay Now", ar: "ادفع الآن", ur: "ابھی ادائیگی کریں" },
    //     },
    //   },
    // },
    // {
    //   type: "module",
    //   module_type: "booking",
    //   moduleKey: "booking",
    //   name: { en: "Booking Widget", ar: "أداة الحجز", ur: "بکنگ ویجٹ" },
    //   icon: "📅",
    //   description: { 
    //     en: "Allow clients to book appointments", 
    //     ar: "السماح للعملاء بحجز المواعيد", 
    //     ur: "کلائنٹس کو اپائنٹمنٹ بک کرنے کی اجازت دیں" 
    //   },
    //   required: false,
    //   defaultContent: {
    //     module_type: "booking",
    //     module_key: "booking",
    //     enabled: true,
    //     settings: {
    //       calendar_view: "week",
    //       time_slot_duration: 30,
    //       buffer_time: 15,
    //     },
    //     labels: {
    //       book_button: { en: "Book Appointment", ar: "احجز موعد", ur: "اپائنٹمنٹ بک کریں" },
    //     },
    //   },
    // },
    // {
    //   type: "module",
    //   module_type: "contact_form",
    //   moduleKey: "contact_form",
    //   name: { en: "Contact Form", ar: "نموذج الاتصال", ur: "رابطہ فارم" },
    //   icon: "📧",
    //   description: { 
    //     en: "Contact form with custom fields", 
    //     ar: "نموذج اتصال مع حقول مخصصة", 
    //     ur: "کسٹم فیلڈز کے ساتھ رابطہ فارم" 
    //   },
    //   required: false,
    //   defaultContent: {
    //     module_type: "contact_form",
    //     module_key: "contact_form",
    //     enabled: true,
    //     settings: {
    //       fields: ["name", "email", "phone", "message"],
    //       required_fields: ["name", "email", "message"],
    //     },
    //     labels: {
    //       submit_button: { en: "Send Message", ar: "إرسال رسالة", ur: "پیغام بھیجیں" },
    //       success_message: { en: "Thanks! We'll be in touch.", ar: "شكراً! سنتواصل معك قريباً.", ur: "شکریہ! ہم جلد رابطہ کریں گے۔" },
    //     },
    //   },
    // },
    {
      type: "module",
      module_type: "custom_request",
      moduleKey: "custom_request",
      name: { en: "Custom Request", ar: "طلب مخصص", ur: "حسب ضرورت درخواست" },
      icon: "📋",
      description: {
        en: "Multi-step custom service request form",
        ar: "نموذج طلب خدمة مخصصة متعدد الخطوات",
        ur: "ملٹی سٹیپ حسب ضرورت سروس ریکویسٹ فارم"
      },
      required: false,
      defaultContent: {
        module_type: "custom_request",
        module_key: "custom_request",
        enabled: true,
        title: { en: "Request Custom Service", ar: "طلب خدمة مخصصة", ur: "حسب ضرورت سروس کی درخواست" },
        subtitle: { en: "Tell us what you need and we'll create a custom quote for you", ar: "أخبرنا بما تحتاجه وسنقدم لك عرض سعر مخصص", ur: "ہمیں بتائیں آپ کو کیا چاہیے اور ہم آپ کے لیے ایک حسب ضرورت کوٹ بنائیں گے" },
        settings: {
          allow_file_uploads: true,
          require_budget: false,
          require_deadline: false,
          allow_guest_submissions: true,
          max_attachments: 5,
          max_file_size_mb: 10,
          show_trust_badges: true,
          show_response_time: true,
          average_response_time: { en: "Within 24 hours", ar: "خلال 24 ساعة", ur: "24 گھنٹوں کے اندر" },
          success_message: { en: "Your request has been submitted successfully! We'll review it and get back to you soon.", ar: "تم إرسال طلبك بنجاح! سنراجعه ونرد عليك قريباً.", ur: "آپ کی درخواست کامیابی سے جمع ہو گئی! ہم اس کا جائزہ لیں گے اور جلد آپ سے رابطہ کریں گے۔" },
          redirect_after_submit: "",
          categories: [],
        },
      },
    },
    {
      type: "module",
      module_type: "customer_requests",
      moduleKey: "customer_requests",
      name: { en: "My Requests Portal", ar: "بوابة طلباتي", ur: "میری درخواستیں پورٹل" },
      icon: "📊",
      description: {
        en: "Customer portal to track custom service requests",
        ar: "بوابة العملاء لتتبع طلبات الخدمة المخصصة",
        ur: "حسب ضرورت سروس کی درخواستوں کو ٹریک کرنے کا کسٹمر پورٹل"
      },
      required: false,
      defaultContent: {
        module_type: "customer_requests",
        module_key: "customer_requests",
        enabled: true,
        title: { en: "My Requests", ar: "طلباتي", ur: "میری درخواستیں" },
        subtitle: { en: "Track the status of your custom service requests", ar: "تتبع حالة طلبات الخدمة المخصصة", ur: "اپنی حسب ضرورت سروس کی درخواستوں کی حیثیت ٹریک کریں" },
        settings: {},
      },
    },
  ];
}

/**
 * Get section categories for sidebar
 */
export function getSectionCategories() {
  return [
    { id: "structural", name: { en: "Structure", ar: "الهيكل", ur: "ڈھانچہ" }, icon: "🏗️" },
    { id: "hero", name: { en: "Hero", ar: "البطل", ur: "ہیرو" }, icon: "🎯" },
    { id: "content", name: { en: "Content", ar: "المحتوى", ur: "مواد" }, icon: "📝" },
    { id: "cta", name: { en: "Call to Action", ar: "دعوة للعمل", ur: "کال ٹو ایکشن" }, icon: "📢" },
    { id: "modules", name: { en: "Modules", ar: "الوحدات", ur: "ماڈیولز" }, icon: "🧩" },
  ];
}

/**
 * Get default theme configuration
 */
export function getDefaultThemeConfig() {
  return {
    colors: {
      primary: "#3B82F6",
      secondary: "#8B5CF6",
      accent: "#F59E0B",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#1F2937",
      textMuted: "#6B7280",
      border: "#E5E7EB",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    fonts: {
      base: "Inter",
      heading: "Inter",
    },
    radius: "0.5rem",
  };
}

/**
 * Get available font options
 */
export function getFontOptions() {
  return [
    { value: "Inter", label: "Inter", category: "sans" },
    { value: "Roboto", label: "Roboto", category: "sans" },
    { value: "Open Sans", label: "Open Sans", category: "sans" },
    { value: "Lato", label: "Lato", category: "sans" },
    { value: "Poppins", label: "Poppins", category: "sans" },
    { value: "Montserrat", label: "Montserrat", category: "sans" },
    { value: "Playfair Display", label: "Playfair Display", category: "serif" },
    { value: "Merriweather", label: "Merriweather", category: "serif" },
    { value: "Cairo", label: "Cairo (Arabic)", category: "arabic" },
    { value: "Amiri", label: "Amiri (Arabic)", category: "arabic" },
    { value: "Noto Nastaliq Urdu", label: "Noto Nastaliq (Urdu)", category: "urdu" },
  ];
}

/**
 * Get available border radius options
 */
export function getRadiusOptions() {
  return [
    { value: "0", label: "None" },
    { value: "0.25rem", label: "Small" },
    { value: "0.5rem", label: "Medium" },
    { value: "0.75rem", label: "Large" },
    { value: "1rem", label: "XL" },
    { value: "1.5rem", label: "2XL" },
    { value: "9999px", label: "Full" },
  ];
}