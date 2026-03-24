// frontend/src/app/tenant-site/%5Bdomain%5D/my-bookings/page.js
import { fetchSite } from "../utils/fetchSite";
import MyBookingsClient from "./MyBookingsClient";
import { notFound } from "next/navigation";

export default async function MyBookingsPage({ params }) {

  const { domain } = await params;

  const siteResult = await fetchSite(domain);
  const { site, sections, error } = siteResult;

  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  if (error || !site?.is_published) {
    notFound();
  }

  return (
    <MyBookingsClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
      defaultLanguage={site.default_language}
    />
  );
}
