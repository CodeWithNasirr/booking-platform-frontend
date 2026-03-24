// src/app/tenant-site/[domain]/services/[slug]/book/page.js
/**
 * Service Booking Page
 *
 * Route: /services/[slug]/book
 * Redirects to the existing booking flow at /booking/service/[slug]
 *
 * This provides a clean URL for booking services while reusing
 * the existing booking infrastructure.
 */

import { redirect } from "next/navigation";

export default async function ServiceBookPage({ params }) {
  const { slug } = await params;

  // Redirect to the existing booking page
  redirect(`/booking/service/${slug}`);
}