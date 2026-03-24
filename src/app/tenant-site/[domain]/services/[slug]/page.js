// // src/app/tenant-site/[domain]/services/[serviceSlug]/order/page.js

// src/app/tenant-site/[domain]/services/[slug]/page.js
/**
 * Service Detail Page (Server Component)
 *
 * Route: /services/[slug]
 * Internal: /tenant-site/[domain]/services/[slug]
 *
 * Fetches service from public API, wraps in tenant layout (header + footer).
 */

import { notFound } from "next/navigation";
import { fetchSite } from "../../utils/fetchSite";
import ServiceDetailClient from "./ServiceDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generateMetadata({ params }) {
  const { domain, slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/public-services/${slug}/`, {
      cache: "no-store",
      headers: { "X-Tenant": domain },
    });

    if (!res.ok) return { title: "Service Not Found" };

    const service = await res.json();
    const name =
      typeof service.name === "object"
        ? service.name.en || Object.values(service.name)[0]
        : service.name;

    return {
      title: service.meta_title?.en || name || "Service",
      description:
        service.meta_description?.en ||
        service.short_description?.en ||
        "",
    };
  } catch {
    return { title: "Service" };
  }
}

export default async function ServiceDetailPage({ params }) {
  const { domain, slug } = await params;

  // Fetch site config + service in parallel
  const [siteResult, serviceRes] = await Promise.all([
    fetchSite(domain),
    fetch(`${API_BASE}/api/v1/public-services/${slug}/`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant": domain,
      },
    }),
  ]);

  const { site, sections, error: siteError } = siteResult;

  if (siteError || !site?.is_published) notFound();

  if (!serviceRes.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Service Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This service may have been removed or is currently unavailable.
          </p>
          <a
            href={`/`}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 inline-block"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const service = await serviceRes.json();

  // Get header/footer from site layout
  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <ServiceDetailClient
      service={service}
      domain={domain}
      site={site}
      header={header}
      footer={footer}
    />
  );
}


// import { fetchSite } from "../../../utils/fetchSite";
// import OrderCheckoutClient from "./OrderCheckoutClient";
// import { notFound } from "next/navigation";

// export function generateMetadata({ params }) {
//   const { serviceSlug } = params;

//   return {
//     title: `Order - ${serviceSlug?.replace(/-/g, " ") || "Service"}`,
//   };
// }

// export default async function OrderCheckoutPage({ params }) {
//   const { domain, slug } = await params;

//   const { site, error } = await fetchSite(domain);
//   if (error || !site?.is_published) {
//     notFound();
//   }

//   return (
//     <OrderCheckoutClient
//       domain={domain}
//       serviceSlug={slug}
//     />
//   );
// }