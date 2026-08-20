import { fetchSite } from "../../../utils/fetchSite";
import { notFound } from "next/navigation";
import OrderCheckoutClient from "./OrderCheckoutClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  return {
    title: `Order - ${slug?.replace(/-/g, " ") || "Service"}`,
  };
}

export default async function OrderCheckoutPage({ params }) {
  const { domain, slug } = await params;

  // fetch site config
  const siteResult = await fetchSite(domain);
  const { site, sections, error: siteError } = siteResult;

  if (siteError || !site?.is_published) {
    notFound();
  }

  // Extract header/footer
  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <OrderCheckoutClient
      domain={domain}
      serviceSlug={slug}
      site={site}
      header={header}
      // footer={footer}
    />
  );
}