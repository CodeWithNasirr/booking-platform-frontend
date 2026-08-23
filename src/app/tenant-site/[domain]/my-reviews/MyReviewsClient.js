"use client";

/**
 * MyReviewsClient — the customer's own review history for this tenant.
 *
 * Reuses the existing review models via GET /api/v1/reviews/my/. The customer
 * is identified by whichever session they already hold:
 *   - a logged-in customer (customer_token JWT) → Authorization: Bearer
 *   - a booking guest session (customer_booking_token_<tenantId>) → Authorization: Bearer
 *   - an order guest session (customer_order_token_*) → X-Order-Token
 * We send all we can find; the backend resolves the email from any of them.
 *
 * States: loading skeleton, error, empty, and "load more" pagination. Each row
 * links to the related booking/order. Mobile-first, RTL-aware, theme-consistent.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutRenderer from "../LayoutRenderer";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { BrandRoot, Button, EmptyState } from "@/components/ui";
import { useTenantLang } from "../../contexts/TenantLangContext";
import StarRating from "@/components/shared/StarRating";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Collect every customer credential we can find in localStorage.
function resolveAuth() {
  const out = { authorization: null, orderToken: null };
  try {
    const jwt = localStorage.getItem("customer_token");
    if (jwt) out.authorization = `Bearer ${jwt}`;

    const keys = Object.keys(localStorage);
    if (!out.authorization) {
      const bKey = keys.find((k) => k.startsWith("customer_booking_token_"));
      if (bKey) {
        const bt = localStorage.getItem(bKey);
        if (bt) out.authorization = bt.startsWith("Bearer ") ? bt : `Bearer ${bt}`;
      }
    }
    const oKey = keys.find((k) => k.startsWith("customer_order_token_"));
    if (oKey) out.orderToken = localStorage.getItem(oKey) || null;
  } catch {
    /* localStorage unavailable */
  }
  return out;
}

const STATUS_STYLES = {
  published: "bg-emerald-100 text-emerald-700",
  hidden: "bg-amber-100 text-amber-700",
};
const STATUS_LABELS = {
  published: "Published",
  hidden: "Under review",
};

function ReviewRow({ review, onOpen, isRTL }) {
  const created = review.created_at ? new Date(review.created_at) : null;
  const target =
    review.source === "order"
      ? tenantRoutes.myOrder(review.target_id)
      : tenantRoutes.myBooking(review.target_id);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className={`flex items-start justify-between gap-3 flex-wrap ${isRTL ? "flex-row-reverse text-right" : ""}`}>
        <div className="min-w-0">
          <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
            <StarRating value={review.rating} size={16} />
            <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
              {review.source}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[review.status] || "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABELS[review.status] || review.status}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-900 truncate">
            {review.service_name || review.business_name || "Service"}
          </div>
          <div className="text-xs text-gray-400">
            {[review.business_name, review.reference].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="text-[11px] text-gray-400 whitespace-nowrap">
          {created ? created.toLocaleDateString() : ""}
        </div>
      </div>

      {review.title ? (
        <div className="mt-2 text-sm font-semibold text-gray-800">{review.title}</div>
      ) : null}
      {review.comment ? (
        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap break-words">{review.comment}</p>
      ) : (
        <p className="mt-1 text-sm text-gray-400 italic">Rated {review.rating}/5</p>
      )}

      {review.provider_response ? (
        <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
          <div className="text-[11px] font-semibold text-gray-500 mb-1">
            Response from {review.business_name || "the business"}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.provider_response}</p>
        </div>
      ) : null}

      {review.target_id ? (
        <div className={`mt-3 pt-3 border-t border-gray-100 flex ${isRTL ? "justify-start" : "justify-end"}`}>
          <button
            onClick={() => onOpen(target)}
            className="text-xs font-medium text-[color:var(--brand-primary,#8B1E3F)] hover:underline"
          >
            {review.source === "order" ? "View order" : "View booking"} →
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function MyReviewsClient({ domain, site, header, footer }) {
  const router = useRouter();
  const { isRTL } = useTenantLang();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const fetchPage = useCallback(
    async (pageNum, append) => {
      const auth = resolveAuth();
      if (!auth.authorization && !auth.orderToken) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      const headers = { "X-Tenant": domain };
      if (auth.authorization) headers["Authorization"] = auth.authorization;
      if (auth.orderToken) headers["X-Order-Token"] = auth.orderToken;

      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/reviews/my/?page=${pageNum}&page_size=10`,
          { headers, credentials: "include" }
        );
        if (res.status === 401 || res.status === 403) {
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const rows = data.results || [];
        setReviews((prev) => (append ? [...prev, ...rows] : rows));
        setHasNext(Boolean(data.has_next));
        setPage(data.page || pageNum);
      } catch {
        setError("Couldn't load your reviews.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [domain]
  );

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <BrandRoot>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}

      <main className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className={`text-2xl font-bold text-gray-900 mb-1 ${isRTL ? "text-right" : ""}`}>
            My Reviews
          </h1>
          <p className={`text-sm text-gray-500 mb-6 ${isRTL ? "text-right" : ""}`}>
            Reviews you've submitted after your bookings and orders.
          </p>

          {loading ? (
            <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading reviews">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : needsAuth ? (
            <EmptyState
              title="Sign in to see your reviews"
              hint="Open one of your bookings or orders from the confirmation email to view and manage your reviews."
              action={
                <Button variant="primary" onClick={() => router.push(tenantRoutes.myBookings())}>
                  Go to my bookings
                </Button>
              }
            />
          ) : error ? (
            <EmptyState
              title="Couldn't load your reviews"
              hint={error}
              action={<Button variant="primary" onClick={() => fetchPage(1, false)}>Try again</Button>}
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              hint="Once you leave a review after a completed booking or order, it'll show up here."
              action={
                <Button variant="primary" onClick={() => router.push(tenantRoutes.myBookings())}>
                  View my bookings
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewRow
                  key={`${r.source}-${r.id}`}
                  review={r}
                  isRTL={isRTL}
                  onOpen={(href) => router.push(href)}
                />
              ))}

              {hasNext ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => fetchPage(page + 1, true)}
                    loading={loadingMore}
                  >
                    Load more
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </BrandRoot>
  );
}
