// src/app/tenant-site/[domain]/provider/orders/[orderId]/page.js
import { fetchSite } from "../../../utils/fetchSite";
import ProviderOrderDetailClient from "./ProviderOrderDetailClient";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  return { title: "Provider - Order Details" };
}

export default async function ProviderOrderDetailPage({ params }) {
  const { domain, orderId } = await params;
  const { site, error } = await fetchSite(domain);

  if (error || !site?.is_published) {
    notFound();
  }

  return (
    <ProviderOrderDetailClient
      domain={domain}
      tenantId={site.id}
      orderId={orderId}
    />
  );
}