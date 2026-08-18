// src/contexts/NotificationsContext.js
"use client";

/**
 * Shared in-app notification state for the tenant dashboard chrome.
 *
 * Mounted once (around Sidebar + Topbar) so there is a SINGLE realtime
 * subscription and a SINGLE poll — the Topbar bell and the Sidebar dots
 * both read from here instead of each opening their own socket.
 *
 * Source of truth is always the backend:
 *   - initial + poll fallback  → GET feed/summary/  (unread totals)
 *   - live nudges              → realtime user:<id> topic, event
 *                                "notification.created" (bumps counts)
 *   - opening a section        → markCategoryRead(category) clears that
 *                                dot via the API, never local-only state.
 *
 * We never invent unread state on the client: realtime only ever
 * increments, and every decrement is the result of a backend mark-read
 * call (or the next poll/refetch reconciling the truth).
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";

import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/lib/realtime";
import {
  fetchNotificationSummary,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notificationsApi";

const SIDEBAR_CATEGORIES = ["bookings", "orders", "custom_requests", "support"];
const POLL_MS = 60000; // fallback refresh; realtime is the primary path

const NotificationsContext = createContext(null);

function emptyByCategory() {
  return SIDEBAR_CATEGORIES.reduce((acc, c) => ((acc[c] = 0), acc), {});
}

export function NotificationsProvider({ children }) {
  const { user, activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant || null;
  const userId = user?.id || null;

  const [totalUnread, setTotalUnread] = useState(0);
  const [byCategory, setByCategory] = useState(emptyByCategory());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Guard against overlapping refetches clobbering each other.
  const inflight = useRef(false);

  const refreshSummary = useCallback(async () => {
    if (!tenantId || !userId) return;
    try {
      const data = await fetchNotificationSummary(tenantId);
      if (data && typeof data.total_unread === "number") {
        setTotalUnread(data.total_unread);
        setByCategory({ ...emptyByCategory(), ...(data.by_category || {}) });
      }
    } catch {
      /* best-effort — the next poll reconciles */
    }
  }, [tenantId, userId]);

  const refreshFeed = useCallback(async () => {
    if (!tenantId || !userId || inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const data = await fetchNotifications(tenantId, { limit: 20 });
      if (data && Array.isArray(data.results)) {
        setItems(data.results);
        if (typeof data.total_unread === "number") setTotalUnread(data.total_unread);
      }
    } catch {
      /* ignore */
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [tenantId, userId]);

  // Initial load + poll fallback.
  useEffect(() => {
    if (!tenantId || !userId) return undefined;
    refreshSummary();
    const t = setInterval(refreshSummary, POLL_MS);
    return () => clearInterval(t);
  }, [tenantId, userId, refreshSummary]);

  // Realtime: live nudge on the recipient's private topic. On reconnect we
  // re-sync via REST so anything missed while offline is reflected.
  const topics = useMemo(
    () => (userId ? [`user:${userId}`] : []),
    [userId]
  );

  const handleEvent = useCallback(
    (env) => {
      if (!env || env.event !== "notification.created") return;
      const n = env.payload || {};
      // Bump counts optimistically; the poll/refetch reconciles exact totals.
      setTotalUnread((c) => c + 1);
      if (n.category && SIDEBAR_CATEGORIES.includes(n.category)) {
        setByCategory((prev) => ({
          ...prev,
          [n.category]: (prev[n.category] || 0) + 1,
        }));
      }
      // Prepend to the dropdown list if it's already been opened/loaded.
      setItems((prev) => (prev.length ? [{ ...n, is_read: false }, ...prev].slice(0, 20) : prev));
    },
    []
  );

  useRealtime({
    topics,
    auth: { jwt: Cookies.get("access_token") || null },
    onEvent: handleEvent,
    onReconnect: refreshSummary,
  });

  // ── Mutations (always backend-first) ──────────────────────────────

  const markRead = useCallback(
    async (id) => {
      if (!tenantId) return;
      // Optimistic: flip the row + decrement counts, then confirm.
      setItems((prev) =>
        prev.map((n) => (n.id === id && !n.is_read ? { ...n, is_read: true } : n))
      );
      try {
        await markNotificationRead(tenantId, id);
      } finally {
        refreshSummary();
      }
    },
    [tenantId, refreshSummary]
  );

  const markCategoryRead = useCallback(
    async (category) => {
      if (!tenantId || !category) return;
      // Clear the dot immediately, then reconcile with the server.
      setByCategory((prev) => ({ ...prev, [category]: 0 }));
      try {
        await markAllNotificationsRead(tenantId, category);
      } finally {
        refreshSummary();
      }
    },
    [tenantId, refreshSummary]
  );

  const markAllRead = useCallback(async () => {
    if (!tenantId) return;
    setTotalUnread(0);
    setByCategory(emptyByCategory());
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(tenantId);
    } finally {
      refreshSummary();
    }
  }, [tenantId, refreshSummary]);

  const value = useMemo(
    () => ({
      totalUnread,
      byCategory,
      items,
      loading,
      refreshFeed,
      refreshSummary,
      markRead,
      markCategoryRead,
      markAllRead,
    }),
    [totalUnread, byCategory, items, loading, refreshFeed, refreshSummary,
     markRead, markCategoryRead, markAllRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  // Safe default so components (e.g. Sidebar) render even if used outside
  // the provider — no unread data, but never a crash.
  return (
    ctx || {
      totalUnread: 0,
      byCategory: emptyByCategory(),
      items: [],
      loading: false,
      refreshFeed: () => {},
      refreshSummary: () => {},
      markRead: () => {},
      markCategoryRead: () => {},
      markAllRead: () => {},
    }
  );
}
