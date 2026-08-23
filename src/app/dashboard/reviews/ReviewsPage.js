"use client";

/**
 * ReviewsPage — tenant moderation dashboard for Reviews & Ratings.
 *
 * Unifies booking + order reviews (backend ReviewAggregator). Lets a tenant:
 *   - see a blended rating summary (average, count, star distribution),
 *   - filter by source / star / visibility,
 *   - hide/show a review on the public storefront,
 *   - reply to a review.
 *
 * Gated by the reviews_ratings plan feature (page.js) and customers.view RBAC.
 * Moderation actions additionally require customers.manage.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Star, MessageSquare, Eye, EyeOff, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import StarRating from "@/components/shared/StarRating";
import reviewsApi from "@/lib/reviewsApi";

const SOURCE_FILTERS = [
  { key: "all", label: "All" },
  { key: "booking", label: "Bookings" },
  { key: "order", label: "Orders" },
];
const VISIBILITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "public", label: "Public" },
  { key: "hidden", label: "Hidden" },
];
const RATING_FILTERS = ["all", "5", "4", "3", "2", "1"];

function SummaryHeader({ summary }) {
  const dist = summary?.distribution || {};
  const total = summary?.total_reviews || 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-gray-900">
          {(summary?.average_rating || 0).toFixed(1)}
        </div>
        <StarRating value={summary?.average_rating || 0} size={18} className="mt-1" />
        <div className="text-xs text-gray-500 mt-1">{total} review{total === 1 ? "" : "s"}</div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:col-span-2">
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = dist[String(s)] || 0;
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={s} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-gray-500 flex items-center gap-0.5">
                  {s}<Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-500">{n}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>Bookings: {summary?.by_source?.booking ?? 0}</span>
          <span>Orders: {summary?.by_source?.order ?? 0}</span>
          <span>Responded: {summary?.response_rate ?? 0}%</span>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review, canManage, onToggle, onRespond, busy }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState(review.provider_response || "");

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 bg-white ${review.is_public ? "border-gray-200" : "border-amber-200 bg-amber-50/40"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StarRating value={review.rating} size={15} />
            <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
              {review.source}
            </span>
            {!review.is_public && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                Hidden
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 truncate">
            {review.reviewer_name || "Customer"}
            {review.service_name ? (
              <span className="text-gray-400 font-normal"> · {review.service_name}</span>
            ) : null}
          </div>
        </div>
        <div className="text-[11px] text-gray-400 whitespace-nowrap">
          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
        </div>
      </div>

      {review.title ? (
        <div className="mt-2 text-sm font-semibold text-gray-800">{review.title}</div>
      ) : null}
      {review.comment ? (
        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap break-words">{review.comment}</p>
      ) : (
        <p className="mt-1 text-sm text-gray-400 italic">No written comment.</p>
      )}

      {review.provider_response && !replying ? (
        <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
          <div className="text-[11px] font-semibold text-gray-500 mb-1">Your response</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.provider_response}</p>
        </div>
      ) : null}

      {replying ? (
        <div className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write a public response…"
            className="w-full text-sm rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
          />
          <div className="mt-2 flex gap-2 justify-end">
            <button
              onClick={() => { setReplying(false); setText(review.provider_response || ""); }}
              className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              onClick={async () => { await onRespond(text); setReplying(false); }}
              className="px-3 py-1.5 text-sm rounded-lg text-white bg-[#8B1E3F] hover:brightness-110 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save response
            </button>
          </div>
        </div>
      ) : null}

      {canManage && !replying ? (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={() => setReplying(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#8B1E3F] px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {review.provider_response ? "Edit response" : "Respond"}
          </button>
          <button
            disabled={busy}
            onClick={() => onToggle(!review.is_public)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#8B1E3F] px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            {review.is_public ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {review.is_public ? "Hide from storefront" : "Show on storefront"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function ReviewsPage() {
  const { activeTenant, t } = useApp();
  const { allowed: canManage } = useTenantPermission("customers.manage");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [source, setSource] = useState("all");
  const [rating, setRating] = useState("all");
  const [visibility, setVisibility] = useState("all");

  const load = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reviewsApi.list({ source, rating, visibility }, activeTenant);
      setRows(data?.results || []);
      setSummary(data?.summary || null);
    } catch (e) {
      setError(e?.message || "Couldn't load reviews.");
    } finally {
      setLoading(false);
    }
  }, [activeTenant, source, rating, visibility]);

  useEffect(() => { load(); }, [load]);

  const patchRow = (r, patch) =>
    setRows((prev) => prev.map((x) => (x.id === r.id && x.source === r.source ? { ...x, ...patch } : x)));

  const handleToggle = async (r, isPublic) => {
    setBusyId(`${r.source}-${r.id}`);
    try {
      const updated = await reviewsApi.setVisibility(r.source, r.id, isPublic, activeTenant);
      patchRow(r, updated);
      // Visibility changes the blended average — refresh the summary.
      reviewsApi.summary(activeTenant).then(setSummary).catch(() => {});
    } catch (e) {
      setError(e?.message || "Couldn't update visibility.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRespond = async (r, text) => {
    setBusyId(`${r.source}-${r.id}`);
    try {
      const updated = await reviewsApi.respond(r.source, r.id, text, activeTenant);
      patchRow(r, updated);
    } catch (e) {
      setError(e?.message || "Couldn't save response.");
    } finally {
      setBusyId(null);
    }
  };

  const filterPill = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      active ? "bg-[#8B1E3F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const empty = !loading && !error && rows.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            {t?.("tenant.reviews") || "Reviews"}
          </h1>
          <p className="text-sm text-gray-500">Customer feedback across bookings and orders.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#8B1E3F] px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {summary ? <SummaryHeader summary={summary} /> : null}

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_FILTERS.map((f) => (
            <button key={f.key} className={filterPill(source === f.key)} onClick={() => setSource(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RATING_FILTERS.map((r) => (
            <button key={r} className={filterPill(rating === r)} onClick={() => setRating(r)}>
              {r === "all" ? "All stars" : `${r}★`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VISIBILITY_FILTERS.map((f) => (
            <button key={f.key} className={filterPill(visibility === f.key)} onClick={() => setVisibility(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-rose-800">{error}</div>
            <button onClick={load} className="mt-1 text-xs text-rose-600 underline">Try again</button>
          </div>
        </div>
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Star className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm font-medium text-gray-600">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Reviews from completed bookings and orders will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <ReviewCard
              key={`${r.source}-${r.id}`}
              review={r}
              canManage={canManage}
              busy={busyId === `${r.source}-${r.id}`}
              onToggle={(isPublic) => handleToggle(r, isPublic)}
              onRespond={(text) => handleRespond(r, text)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
