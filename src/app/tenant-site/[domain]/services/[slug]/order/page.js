// src/app/tenant-site/[domain]/services/[serviceSlug]/order/page.js
import { fetchSite } from "../../../utils/fetchSite";
import OrderCheckoutClient from "./OrderCheckoutClient";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { serviceSlug } = await params;
  return {
    title: `Order - ${serviceSlug.replace(/-/g, " ")}`,
  };
}

export default async function OrderCheckoutPage({ params }) {
  const { domain, serviceSlug } = await params;
  const { site, error } = await fetchSite(domain);

  if (error || !site?.is_published) {
    notFound();
  }

  return (
    <OrderCheckoutClient
      domain={domain}
      tenantId={site.id}
      serviceSlug={serviceSlug}
    />
  );
}