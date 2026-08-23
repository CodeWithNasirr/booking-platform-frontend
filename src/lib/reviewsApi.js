// src/lib/reviewsApi.js
/**
 * Reviews API — tenant moderation surface for Reviews & Ratings.
 *
 * Backend (apps/reviews):
 *   GET   /api/v1/reviews/                 list + summary (filters)
 *   GET   /api/v1/reviews/summary/         blended rating summary
 *   PATCH /api/v1/reviews/<source>/<id>/   moderate (is_public / provider_response)
 *
 * All calls are tenant-scoped + gated by the reviews_ratings plan feature on
 * the backend; apiFetch already attaches the X-Tenant / impersonation headers.
 */

import { apiFetch } from "@/lib/apiClient";

const reviewsApi = {
  async list({ source, rating, visibility } = {}, activeTenant) {
    const q = new URLSearchParams();
    if (source && source !== "all") q.append("source", source);
    if (rating && rating !== "all") q.append("rating", rating);
    if (visibility && visibility !== "all") q.append("visibility", visibility);
    const qs = q.toString();
    return apiFetch(`/api/v1/reviews/${qs ? `?${qs}` : ""}`, activeTenant, {
      method: "GET",
    });
  },

  async summary(activeTenant) {
    return apiFetch("/api/v1/reviews/summary/", activeTenant, { method: "GET" });
  },

  async setVisibility(source, id, isPublic, activeTenant) {
    return apiFetch(`/api/v1/reviews/${source}/${id}/`, activeTenant, {
      method: "PATCH",
      body: JSON.stringify({ is_public: isPublic }),
    });
  },

  async respond(source, id, text, activeTenant) {
    return apiFetch(`/api/v1/reviews/${source}/${id}/`, activeTenant, {
      method: "PATCH",
      body: JSON.stringify({ provider_response: text }),
    });
  },
};

export default reviewsApi;
