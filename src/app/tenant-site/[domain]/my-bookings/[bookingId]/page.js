// src/app/tenant-site/[domain]/my-bookings/[bookingId]/page.js
import { notFound } from "next/navigation";
import { fetchSite } from "../../utils/fetchSite";
import BookingDetailClient from "./BookingDetailClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);

  const name = site?.tenant?.name || "Booking Details";

  return {
    title: `Booking Details | ${name}`,
    description: `View your booking details from ${name}`,
  };
}

export default async function BookingDetailPage({ params }) {
  const { domain, bookingId } = await params;

  const siteResult = await fetchSite(domain);
  const { site, sections, error } = siteResult;

  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <BookingDetailClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
      bookingId={bookingId}
    />
  );
}