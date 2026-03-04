// src/app/tenant-site/[domain]/provider/orders/page.js
import { fetchSite } from "../../utils/fetchSite";
import ProviderOrdersClient from "./ProviderOrdersClient";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  return { title: "Provider - My Orders" };
}

export default async function ProviderOrdersPage({ params }) {
  const { domain } = await params;
  const { site, error } = await fetchSite(domain);

  if (error || !site?.is_published) {
    notFound();
  }

  return (
    <ProviderOrdersClient
      domain={domain}
      tenantId={site.id}
    />
  );
}