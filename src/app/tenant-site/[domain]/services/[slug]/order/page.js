// src/app/tenant-site/[domain]/services/[serviceSlug]/order/page.js
import { fetchSite } from "../../../utils/fetchSite";
import OrderCheckoutClient from "./OrderCheckoutClient";
import { notFound } from "next/navigation";

export function generateMetadata({ params }) {
  const { serviceSlug } = params;

  return {
    title: `Order - ${serviceSlug?.replace(/-/g, " ") || "Service"}`,
  };
}

export default async function OrderCheckoutPage({ params }) {
  const { domain, slug } = await params;

  const { site, error } = await fetchSite(domain);
  if (error || !site?.is_published) {
    notFound();
  }

  return (
    <OrderCheckoutClient
      domain={domain}
      serviceSlug={slug}
    />
  );
}