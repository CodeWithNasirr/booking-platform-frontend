// src/lib/mediaUrl.js
// Resolve a possibly-relative media URL (e.g. "/media/bookings/x.png" returned
// by a FileField without request context, or by a realtime event) to an
// absolute URL against the API host. Absolute/data/blob URLs pass through.
export function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
