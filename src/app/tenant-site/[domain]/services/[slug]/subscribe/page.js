// src/app/tenant-site/[domain]/services/[slug]/subscribe/page.js

import { notFound } from "next/navigation";
import { fetchSite } from "../../../utils/fetchSite";
import SubscribeClient from "./SubscribeClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `Subscribe - ${slug?.replace(/-/g, " ") || "Service"}`,
  };
}

export default async function SubscribePage({ params }) {
  const { domain, slug } = await params;

  const siteResult = await fetchSite(domain);
  const { site, sections, error: siteError } = siteResult;
  if (siteError || !site?.is_published) notFound();

  // Fetch service detail (server-side, so a non-subscribable service 404s early)
  let service = null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/public-services/${slug}/`, {
      cache: "no-store",
      headers: { "X-Tenant": domain },
    });
    if (res.ok) service = await res.json();
  } catch {
    // fall through; client will show error state
  }

  if (!service) notFound();
  if (!["monthly", "yearly"].includes(service.billing_type)) {
    // Service is not subscribable; bounce to the regular detail page would be ideal,
    // but Next router redirect from RSC requires the redirect() helper.
    notFound();
  }

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <SubscribeClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
      service={service}
    />
  );
}
