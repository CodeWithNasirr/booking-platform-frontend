// src/components/dashboard/NotificationBell.js
"use client";

/**
 * Topbar notification bell + dropdown.
 *
 * Reads shared state from NotificationsContext (one socket/poll for the
 * whole dashboard). Shows the unread count badge; the dropdown lists the
 * newest notifications with type, timestamp and a deep link. Clicking a
 * row marks it read (backend) and navigates to its target; "Mark all
 * read" clears everything. No local-only unread state — every change is
 * driven by the backend read state.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";

import { useNotifications } from "@/contexts/NotificationsContext";

const CATEGORY_LABEL = {
  bookings: "Booking",
  orders: "Order",
  custom_requests: "Custom Request",
  support: "Support",
  billing: "Billing",
  integrations: "Integration",
  subscriptions: "Subscription",
  platform: "Platform",
};

const LEVEL_DOT = {
  info: "bg-blue-400",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  critical: "bg-red-500",
};

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell({ isRTL = false }) {
  const {
    totalUnread,
    items,
    loading,
    refreshFeed,
    markRead,
    markAllRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  // Load the newest list when the dropdown opens.
  useEffect(() => {
    if (open) refreshFeed();
  }, [open, refreshFeed]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const badge = totalUnread > 99 ? "99+" : String(totalUnread);

  const onRowClick = (n) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.target_url) router.push(n.target_url);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative p-1 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {totalUnread > 0 && (
          <span
            className={`absolute -top-1 ${
              isRTL ? "-left-1" : "-right-1"
            } min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center`}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background shadow-lg ${
            isRTL ? "left-0" : "right-0"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Notifications</span>
            {totalUnread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onRowClick(n)}
                className={`w-full text-start flex gap-3 px-4 py-3 border-b border-border/60 hover:bg-muted/60 transition-colors ${
                  n.is_read ? "opacity-70" : ""
                }`}
              >
                <span
                  className={`mt-1.5 flex-shrink-0 h-2 w-2 rounded-full ${
                    LEVEL_DOT[n.level] || LEVEL_DOT.info
                  } ${n.is_read ? "opacity-30" : ""}`}
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {CATEGORY_LABEL[n.category] || n.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                  <span className="block text-sm font-medium text-foreground truncate">
                    {n.title}
                  </span>
                  {n.body ? (
                    <span className="block text-xs text-muted-foreground truncate">
                      {n.body}
                    </span>
                  ) : null}
                </span>
                {!n.is_read && (
                  <Check
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100"
                    aria-hidden
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
