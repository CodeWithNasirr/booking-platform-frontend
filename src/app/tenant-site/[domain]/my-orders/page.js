// src/app/tenant-site/[domain]/my-orders/page.js

/**
 * My Orders Page (Tenant Site — Customer-Facing)
 *
 * Route: /{domain}/my-orders
 */

import { notFound } from "next/navigation";
import { fetchSite } from "../utils/fetchSite";

import MyOrdersClient from "./MyOrdersClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);

  const name = site?.tenant?.name || "My Orders";

  return {
    title: `My Orders | ${name}`,
    description: `View your service orders from ${name}`,
  };
}

export default async function MyOrdersPage({ params }) {
  const { domain } = await params;

  const siteResult = await fetchSite(domain);
  const { site, sections, error } = siteResult;

  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <MyOrdersClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
    />
  );
}