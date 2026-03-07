// frontend/src/app/tenant-site/%5Bdomain%5D/my-bookings/page.js
import { fetchSite } from "../utils/fetchSite";
import MyBookingsClient from "./MyBookingsClient";
import { notFound } from "next/navigation";

export default async function MyBookingsPage({ params }) {

  const { domain } = await params;
  const { site, error } = await fetchSite(domain);

  if (error || !site?.is_published) {
    notFound();
  }

  return (
    <MyBookingsClient
      domain={domain}
      defaultLanguage={site.default_language}
    />
  );
}
