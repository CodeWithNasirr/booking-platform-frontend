// src/app/tenant-site/[domain]/services/page.js
/**
 * Services Listing Page (Server Component)
 *
 * Route: /services
 * Shows all active services with category filtering.
 */

import { notFound } from "next/navigation";
import { fetchSite } from "../utils/fetchSite";

import ServicesListClient from "./ServicesListClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);
  const name = site?.tenant?.name || "Services";

  return {
    title: `Services | ${name}`,
    description: `Browse all services offered by ${name}`,
  };
}

export default async function ServicesPage({ params }) {
  const { domain } = await params;

  const [siteResult, servicesRes] = await Promise.all([
    fetchSite(domain),
    fetch(`${API_BASE}/api/v1/public-services/`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant": domain,
      },
    }),
  ]);

  const { site, sections, error } = siteResult;
  if (error || !site?.is_published) notFound();

  let services = [];
  if (servicesRes.ok) {
    const data = await servicesRes.json();
    services = data.results || data || [];
  }

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <ServicesListClient
      services={services}
      domain={domain}
      site={site}
      header={header}
      footer={footer}
    />
  );
}