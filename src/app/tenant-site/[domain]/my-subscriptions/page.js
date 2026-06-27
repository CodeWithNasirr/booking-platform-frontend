// src/app/tenant-site/[domain]/my-subscriptions/page.js

import { notFound } from "next/navigation";
import { fetchSite } from "../utils/fetchSite";

import MySubscriptionsClient from "./MySubscriptionsClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);
  const name = site?.tenant?.name || "My Subscriptions";

  return {
    title: `My Subscriptions | ${name}`,
    description: `Manage your active subscriptions from ${name}`,
  };
}

export default async function MySubscriptionsPage({ params }) {
  const { domain } = await params;
  const siteResult = await fetchSite(domain);
  const { site, sections, error } = siteResult;

  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <MySubscriptionsClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
    />
  );
}
