"use client";

/**
 * ProviderPicker
 *
 * Searchable, keyboard-navigable provider picker used from the
 * order + custom-request assignment modals. Replaces the bare
 * <select> that made picking one of dozens of providers painful.
 *
 * Props:
 *   providers        — array of provider rows (any shape returned by
 *                      /services/{id}/providers/). Reads:
 *                        id, name / full_name / first+last / email,
 *                        avatar_url, active_orders_count,
 *                        average_rating, is_active
 *   loading          — show skeletons instead of the list
 *   value            — currently-selected provider id (controlled)
 *   onChange         — (id, providerRow) => void
 *   currentProviderId — highlight the request/order's existing provider
 *                       (still selectable, just marked "current")
 *   placeholder      — search input placeholder
 *   emptyHint        — copy shown when no providers exist
 *   noMatchHint      — copy shown when the search filter has no hits
 *   className        — layout overrides for the outer container
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CheckCircle2, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui";

function providerName(p) {
  return (
    p.name
    || p.full_name
    || [p.first_name, p.last_name].filter(Boolean).join(" ")
    || p.email
    || p.id
  );
}

function providerEmail(p) {
  return p.email || (p.user && p.user.email) || "";
}

function providerAvatarSrc(p) {
  return p.avatar_url || p.photo_url || (p.user && p.user.avatar_url) || null;
}

function matchesQuery(p, q) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    providerName(p),
    providerEmail(p),
    p.title,
    p.role,
    p.specialty,
    ...(Array.isArray(p.tags) ? p.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export default function ProviderPicker({
  providers = [],
  loading = false,
  value,
  onChange,
  currentProviderId = null,
  placeholder = "Search providers by name or email…",
  emptyHint = "No active providers yet. Invite one from the Providers page.",
  noMatchHint = "No providers match that search.",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query;
    const list = providers.filter((p) => matchesQuery(p, q));
    // Current provider first, then active, then rest.
    return list.sort((a, b) => {
      if (currentProviderId) {
        if (a.id === currentProviderId) return -1;
        if (b.id === currentProviderId) return 1;
      }
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return 0;
    });
  }, [providers, query, currentProviderId]);

  // Keep the highlight index in bounds as the list changes.
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  // Scroll the highlighted row into view when navigating with arrows.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (el && "scrollIntoView" in el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const p = filtered[activeIndex];
      if (p) onChange?.(p.id, p);
    }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Search */}
      <label className="relative">
        <span className="sr-only">Search providers</span>
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-[color:var(--brand-primary,#3B82F6)] focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/20"
          autoFocus
        />
      </label>

      {/* List */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Providers"
        className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100"
      >
        {loading ? (
          <div className="p-3 space-y-2" role="status" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-6 h-6 text-gray-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500">
              {providers.length === 0 ? emptyHint : noMatchHint}
            </p>
          </div>
        ) : (
          filtered.map((p, i) => {
            const selected = value === p.id;
            const active = activeIndex === i;
            const isCurrent = currentProviderId === p.id;
            const name = providerName(p);
            const email = providerEmail(p);
            const src = providerAvatarSrc(p);
            const load = p.active_orders_count;
            const rating = p.average_rating;
            return (
              <button
                key={p.id}
                type="button"
                data-idx={i}
                role="option"
                aria-selected={selected}
                onClick={() => onChange?.(p.id, p)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition ${
                  active ? "bg-[color:var(--brand-primary,#3B82F6)]/5" : ""
                } ${selected ? "bg-[color:var(--brand-primary,#3B82F6)]/10" : ""}`}
              >
                <Avatar name={name} role="provider" size="md" src={src} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[color:var(--brand-primary,#3B82F6)]/10 text-[color:var(--brand-primary,#3B82F6)]">
                        current
                      </span>
                    )}
                    {p.is_active === false && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                  {(Number.isFinite(load) || Number.isFinite(rating)) && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {Number.isFinite(rating) && (
                        <span>★ {Number(rating).toFixed(1)}</span>
                      )}
                      {Number.isFinite(rating) && Number.isFinite(load) && (
                        <span className="mx-1.5">·</span>
                      )}
                      {Number.isFinite(load) && (
                        <span>{load} active {load === 1 ? "order" : "orders"}</span>
                      )}
                    </p>
                  )}
                </div>
                {selected && (
                  <CheckCircle2
                    className="w-5 h-5 text-[color:var(--brand-primary,#3B82F6)] shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
