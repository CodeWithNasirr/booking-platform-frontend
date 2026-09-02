/**
 * /tenant-site/[domain]/layout.js
 * 
 * Root layout for tenant sites.
 * 
 * Responsibilities:
 * 1. Fetch tenant site configuration by domain
 * 2. Wrap children with TenantThemeProvider (CSS variables)
 * 3. Wrap children with TenantLangProvider (RTL support)
 * 4. Set meta tags, favicon, etc.
 * 
 * This follows the EXACT same pattern as TemplateClientWrapper.
 */

import { fetchSite, fetchTheme } from "./utils/fetchSite";
import TenantClientWrapper from "./TenantClientWrapper";
import { notFound } from "next/navigation";
import Script from "next/script";
import { fetchIntegrations } from "@/lib/fetchIntegrations";
import PlatformGate from "@/components/ui/PlatformGate";
import { resolveMediaUrl } from "@/lib/mediaUrl";

import "./styles.css"
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const resolved = await params; // unwrap params promise
  const domain = resolved.domain;
  
  try {
    const { site, error } = await fetchSite(domain);
    
    if (error || !site) {
      return {
        title: "Site Not Found",
        description: "The requested site could not be found.",
      };
    }

    const ogImage = site.og_image || null;
    const favicon = resolveMediaUrl(site.tenant_favicon);
    return {
      title: site.seo_title || site.business_name || site.tenant?.name || "Welcome",
      description: site.seo_description || "",
      keywords: site.seo_keywords || "",
      robots: { index: true, follow: true },
      // Apply the tenant's uploaded favicon to the browser tab.
      ...(favicon ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } } : {}),
      openGraph: {
        title: site.seo_title || site.business_name || site.tenant?.name,
        description: site.seo_description,
        type: "website",
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
      ...(ogImage
        ? { twitter: { card: "summary_large_image", images: [ogImage] } }
        : {}),
    };
  } catch {
    return {
      title: "Welcome",
      description: "",
    };
  }
}




export default async function TenantSiteLayout({ children, params }) {
  const resolved = await params;
  const domain = resolved.domain;

  const { site, theme, error, code, status } = await fetchSite(domain);

  if (status === 503 || code === "maintenance") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            We'll be back soon
          </h1>

          <p className="text-white/70">
            This site is temporarily under maintenance.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Fetch integrations
  const integrations = await fetchIntegrations(domain);

  // ✅ Extract IDs
  const metaPixelId = integrations.find(
    (i) => i.integration_type === "meta_pixel"
  )?.config?.pixel_id;

  const gaId = integrations.find(
    (i) => i.integration_type === "google_analytics"
  )?.config?.measurement_id;

  const gtmId = integrations.find(
    (i) => i.integration_type === "gtm"
  )?.config?.container_id;

  const tiktokPixelId = integrations.find(
    (i) => i.integration_type === "tiktok_pixel"
  )?.config?.pixel_id;

  // Existing logic
  const rtlEnabled = site.rtl_enabled || false;
  const themeDefaults = site.template?.theme_defaults || {};
  const themeConfig = site.theme_config || {};

  const mergedTheme = {
    ...themeDefaults,
    ...themeConfig,
    ...theme,
  };

  const defaultLang = site.settings?.default_language || "en";
  const supportedLanguages =
    site.settings?.supported_languages || ["en", "ar", "ur"];
  const tenantTimezone = site.tenant_timezone || "UTC";

 return (
  <>
    {/* ✅ META PIXEL */}
    {metaPixelId && (
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}
          (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
    )}

    {/* ✅ GOOGLE ANALYTICS */}
    {gaId && (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />

        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
      </>
    )}

    {/* ✅ GTM */}
    {gtmId && (
      <Script id="gtm" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),
            dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    )}

    {/* ✅ TIKTOK */}
    {tiktokPixelId && (
      <Script id="tiktok-pixel" strategy="afterInteractive">
        {`
          !function(w,d,t){
            w.TiktokAnalyticsObject=t;
            var ttq=w[t]=w[t]||[];
            ttq.load('${tiktokPixelId}');
            ttq.page();
          }(window,document,'ttq');
        `}
      </Script>
    )}

    {/* ✅ PLATFORM GATE */}
    <PlatformGate>
      <TenantClientWrapper
        theme={mergedTheme}
        themeDefaults={themeDefaults}
        defaultLang={defaultLang}
        rtlEnabled={rtlEnabled}
        supportedLanguages={supportedLanguages}
        site={site}
        tenantTimezone={tenantTimezone}
      >
        {children}
      </TenantClientWrapper>
    </PlatformGate>
  </>
);
}


// export default async function TenantSiteLayout({ children, params }) {
//   // const { domain } = params;      // params is a ReactPromise
//   const resolved = await params; // unwrap it

//   const domain = resolved.domain;

//   // console.log(domain,"DDDDDDDDDDDDDDD")
  
//   // Fetch site and theme data (SSR)
//   const { site, theme, error } = await fetchSite(domain);

//   const integrations = await fetchIntegrations(domain);

//   const metaPixelId = integrations.find(
//     (i) => i.integration_type === "meta_pixel"
//   )?.config?.pixel_id;

//   const gaId = integrations.find(
//     (i) => i.integration_type === "google_analytics"
//   )?.config?.measurement_id;

//   const gtmId = integrations.find(
//     (i) => i.integration_type === "gtm"
//   )?.config?.container_id;

//   const tiktokPixelId = integrations.find(
//     (i) => i.integration_type === "tiktok_pixel"
//   )?.config?.pixel_id;


//   // Handle site not found
//   if (error || !site) {
//     return (
//       <html lang="en" dir="ltr">
//         <head>
//           <meta charSet="utf-8" />
//           <meta name="viewport" content="width=device-width, initial-scale=1" />
//         </head>
//         <body>
//           <div className="min-h-screen flex items-center justify-center bg-gray-50">
//             <div className="text-center p-8">
//               <h1 className="text-4xl font-bold text-gray-900 mb-4">
//                 Site Not Found
//               </h1>
//               <p className="text-gray-600 mb-6">
//                 The site "{domain}" could not be found or is not published.
//               </p>
//               <a
//                 href="/"
//                 className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
//               >
//                 Go Home
//               </a>
//             </div>
//           </div>
//         </body>
//       </html>
//     );
//   }

//   // Extract configuration
//   const rtlEnabled = site.rtl_enabled || false;
//   const themeDefaults = site.template?.theme_defaults || {};
//   const themeConfig = site.theme_config || {};

//   // Merge theme_defaults + theme_config
//   const mergedTheme = {
//     ...themeDefaults,
//     ...themeConfig,
//     ...theme,
//   };

//   // Default language (can be extended from site settings)
//   const defaultLang = site.settings?.default_language || "en";
//   const supportedLanguages = site.settings?.supported_languages || ["en", "ar", "ur"];
//   const tenantTimezone = site.tenant_timezone || "UTC";

//   return (
//     <TenantClientWrapper
//       theme={mergedTheme}
//       themeDefaults={themeDefaults}
//       defaultLang={defaultLang}
//       rtlEnabled={rtlEnabled}
//       supportedLanguages={supportedLanguages}
//       site={site}
//       tenantTimezone={tenantTimezone}
//     >
//       {children}
//     </TenantClientWrapper>
//   );
// }
