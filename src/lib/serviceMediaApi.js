// src/lib/serviceMediaApi.js
//
// One place for every media upload/delete call. Uploads go through the
// dedicated backend endpoints (multipart/form-data) — never by putting a URL in
// the service payload — so the server owns the storage key and the file is
// validated + stored on Cloudflare R2. apiFetch handles auth, the X-Tenant
// header, and (for FormData) leaves Content-Type to the browser so the
// multipart boundary is set correctly.

import { apiFetch } from "@/lib/apiClient";

/** Upload/replace the service's main image. Returns { key, url, ... }. */
export async function uploadServiceImage(slug, file, tenantId) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await apiFetch(`/api/v1/services/${slug}/upload_image/`, tenantId, {
    method: "POST",
    body: fd,
  });
  return res?.media || res?.image || res;
}

/** Upload one or more gallery images. Returns the normalized gallery array. */
export async function uploadServiceGallery(slug, files, tenantId) {
  const fd = new FormData();
  for (const f of files) fd.append("images", f);
  const res = await apiFetch(`/api/v1/services/${slug}/upload_gallery/`, tenantId, {
    method: "POST",
    body: fd,
  });
  return res?.gallery || [];
}

/** Delete ONE gallery image by its storage key. Returns the remaining gallery. */
export async function deleteServiceGalleryImage(slug, key, tenantId) {
  const res = await apiFetch(
    `/api/v1/services/${slug}/delete_gallery_image/`,
    tenantId,
    { method: "POST", body: JSON.stringify({ key }) }
  );
  return res?.gallery || [];
}

/** Upload an Open-Graph / SEO image (website builder). Returns { url, ... }. */
export async function uploadOGImage(file, tenantId) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`/api/v1/website/media/og-image/`, tenantId, {
    method: "POST",
    body: fd,
  });
  return res?.media || res;
}
