"use client";

/**
 * ReviewsModule — public storefront display of a tenant's real reviews.
 *
 * Fetches GET /api/v1/public/reviews/ scoped to the storefront domain
 * (X-Tenant header). The backend returns ONLY public reviews and only when
 * the tenant's plan includes reviews_ratings — so this component renders
 * nothing (returns null) whenever there's nothing to show, making it safe to
 * place in any layout.
 *
 * Read-only + tenant-scoped: it never exposes internal reference numbers or
 * private reviews (the backend strips those before it ever reaches here).
 */

import { useEffect, useState } from "react";
import StarRating from "@/components/shared/StarRating";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReviewsModule({ domain, settings = {}, lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!domain) { setLoading(false); return undefined; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/public/reviews/`, {
          headers: { "X-Tenant": domain },
        });
        const json = await res.json().catch(() => null);
        if (!cancelled) setData(res.ok ? json : null);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [domain]);

  if (loading) return null;
  const reviews = data?.results || [];
  const summary = data?.summary;
  if (!reviews.length) return null;

  const title = settings?.title || (lang === "ar" ? "آراء العملاء" : "What our customers say");
  const limit = Number(settings?.limit) || 6;
  const shown = reviews.slice(0, limit);

  return (
    <section className="px-6 md:px-12 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          {summary?.total_reviews ? (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">
              <StarRating value={summary.average_rating} size={18} />
              <span className="font-semibold text-gray-900">
                {Number(summary.average_rating).toFixed(1)}
              </span>
              <span className="text-gray-400">
                ({summary.total_reviews} review{summary.total_reviews === 1 ? "" : "s"})
              </span>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((r) => (
            <div key={`${r.source}-${r.id}`} className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col">
              <StarRating value={r.rating} size={15} />
              {r.comment ? (
                <p className="mt-2 text-sm text-gray-600 flex-1 whitespace-pre-wrap break-words line-clamp-6">
                  {r.comment}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-400 italic flex-1">Rated {r.rating}/5</p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-900">{r.reviewer_name || "Customer"}</div>
                {r.service_name ? <div className="text-xs text-gray-400">{r.service_name}</div> : null}
              </div>
              {r.provider_response ? (
                <div className="mt-3 rounded-xl bg-gray-50 p-3">
                  <div className="text-[11px] font-semibold text-gray-500 mb-1">Response</div>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">{r.provider_response}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
