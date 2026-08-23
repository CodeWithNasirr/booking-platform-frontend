// src/app/tenant-site/[domain]/my-reviews/page.js
/**
 * My Reviews Page (Tenant Site — Customer-Facing)
 *
 * Route: /{domain}/my-reviews
 * Shows every review the logged-in customer has submitted (bookings + orders).
 */

import { notFound } from "next/navigation";
import { fetchSite } from "../utils/fetchSite";
import MyReviewsClient from "./MyReviewsClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);
  const name = site?.tenant?.name || "My Reviews";
  return {
    title: `My Reviews | ${name}`,
    description: `Reviews you've submitted to ${name}`,
  };
}

export default async function MyReviewsPage({ params }) {
  const { domain } = await params;

  const { site, sections, error } = await fetchSite(domain);
  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <MyReviewsClient domain={domain} site={site} header={header} footer={footer} />
  );
}
