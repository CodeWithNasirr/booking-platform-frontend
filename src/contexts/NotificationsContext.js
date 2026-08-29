// src/contexts/NotificationsContext.js
"use client";

/**
 * Shared in-app notification state for dashboard chrome (tenant AND
 * platform-admin). Mounted once per app (around Sidebar + Topbar) so there
 * is a SINGLE realtime subscription and a SINGLE poll; the bell and the
 * sidebar dots both read from here.
 *
 * Two providers share ONE context so the same NotificationBell / sidebar
 * badge code works under either:
 *   - NotificationsProvider          → tenant feed  (apiFetch, access_token)
 *   - PlatformNotificationsProvider  → platform feed (platformFetch,
 *                                       platform_access_token)
 *
 * Source of truth is always the backend: initial + poll → summary; live
 * nudges → realtime user:<id> topic; every decrement is a backend
 * mark-read (never local-only state).
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
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import { useRealtime } from "@/lib/realtime";
import {
  fetchNotificationSummary,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markNotificationsReadByTarget,
  fetchPlatformNotificationSummary,
  fetchPlatformNotifications,
  markPlatformNotificationRead,
  markAllPlatformNotificationsRead,
} from "@/lib/notificationsApi";

const TENANT_CATEGORIES = ["bookings", "orders", "custom_requests", "support"];
const PLATFORM_CATEGORIES = ["platform", "support", "billing", "enterprise", "integrations"];
const POLL_MS = 60000;

const NotificationsContext = createContext(null);

function emptyByCategory(categories) {
  return categories.reduce((acc, c) => ((acc[c] = 0), acc), {});
}

/**
 * The whole state machine, parametrised by scope config so tenant and
 * platform providers share it. `cfg`:
 *   userId, jwt, categories, ready (bool), and an `api` of
 *   { summary, list, markRead, markAll }.
 */
function useFeedState(cfg) {
  const { userId, jwt, categories, ready, api } = cfg;

  const [totalUnread, setTotalUnread] = useState(0);
  const [byCategory, setByCategory] = useState(emptyByCategory(categories));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const inflight = useRef(false);

  const refreshSummary = useCallback(async () => {
    if (!ready) return;
    try {
      const data = await api.summary();
      if (data && typeof data.total_unread === "number") {
        setTotalUnread(data.total_unread);
        setByCategory({ ...emptyByCategory(categories), ...(data.by_category || {}) });
      }
    } catch {
      /* best-effort — the next poll reconciles */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, api.summary]);

  const refreshFeed = useCallback(async () => {
    if (!ready || inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const data = await api.list({ limit: 20 });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, api.list]);

  useEffect(() => {
    if (!ready) return undefined;
    refreshSummary();
    const t = setInterval(refreshSummary, POLL_MS);
    return () => clearInterval(t);
  }, [ready, refreshSummary]);

  const topics = useMemo(() => (userId ? [`user:${userId}`] : []), [userId]);

  const handleEvent = useCallback(
    (env) => {
      if (!env || env.event !== "notification.created") return;
      const n = env.payload || {};
      setTotalUnread((c) => c + 1);
      if (n.category && categories.includes(n.category)) {
        setByCategory((prev) => ({ ...prev, [n.category]: (prev[n.category] || 0) + 1 }));
      }
      setItems((prev) =>
        prev.length ? [{ ...n, is_read: false }, ...prev].slice(0, 20) : prev
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories.join(",")]
  );

  useRealtime({
    topics,
    auth: { jwt: jwt || null },
    onEvent: handleEvent,
    onReconnect: refreshSummary,
  });

  const markRead = useCallback(
    async (id) => {
      setItems((prev) => prev.map((n) => (n.id === id && !n.is_read ? { ...n, is_read: true } : n)));
      try {
        await api.markRead(id);
      } finally {
        refreshSummary();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.markRead, refreshSummary]
  );

  const markCategoryRead = useCallback(
    async (category) => {
      if (!category) return;
      setByCategory((prev) => ({ ...prev, [category]: 0 }));
      try {
        await api.markAll(category);
      } finally {
        refreshSummary();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.markAll, refreshSummary]
  );

  const markAllRead = useCallback(
    async () => {
      setTotalUnread(0);
      setByCategory(emptyByCategory(categories));
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await api.markAll();
      } finally {
        refreshSummary();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.markAll, refreshSummary]
  );

  // Called when a conversation/detail view for one object is opened. Clears
  // ONLY that object's notifications (backend), then reconciles counts so the
  // Topbar and every sidebar dot update together without a page refresh.
  const markTargetRead = useCallback(
    async (targetType, targetId) => {
      if (!targetType || !targetId || !api.markTarget) return;
      // Optimistically drop matching unread items from the dropdown list.
      setItems((prev) =>
        prev.map((n) =>
          n.target_type === targetType && String(n.target_id) === String(targetId)
            ? { ...n, is_read: true }
            : n
        )
      );
      try {
        await api.markTarget(targetType, targetId);
      } finally {
        // Server truth for both the bell count and the sidebar dots.
        refreshSummary();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.markTarget, refreshSummary]
  );

  return useMemo(
    () => ({
      totalUnread, byCategory, items, loading,
      refreshFeed, refreshSummary, markRead, markCategoryRead, markAllRead,
      markTargetRead,
    }),
    [totalUnread, byCategory, items, loading, refreshFeed, refreshSummary,
     markRead, markCategoryRead, markAllRead, markTargetRead]
  );
}

// ── Tenant provider ────────────────────────────────────────────────

export function NotificationsProvider({ children }) {
  const { user, activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant || null;
  const userId = user?.id || null;

  const api = useMemo(
    () => ({
      summary: () => fetchNotificationSummary(tenantId),
      list: (opts) => fetchNotifications(tenantId, opts),
      markRead: (id) => markNotificationRead(tenantId, id),
      markAll: (category) => markAllNotificationsRead(tenantId, category),
      markTarget: (type, id) => markNotificationsReadByTarget(tenantId, type, id),
    }),
    [tenantId]
  );

  const value = useFeedState({
    userId,
    jwt: Cookies.get("access_token"),
    categories: TENANT_CATEGORIES,
    ready: !!(tenantId && userId),
    api,
  });

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// ── Platform-admin provider ────────────────────────────────────────

export function PlatformNotificationsProvider({ children }) {
  const { user } = useSuperAdmin();
  const userId = user?.id || null;

  const api = useMemo(
    () => ({
      summary: () => fetchPlatformNotificationSummary(),
      list: (opts) => fetchPlatformNotifications(opts),
      markRead: (id) => markPlatformNotificationRead(id),
      markAll: (category) => markAllPlatformNotificationsRead(category),
    }),
    []
  );

  const value = useFeedState({
    userId,
    jwt: Cookies.get("platform_access_token"),
    categories: PLATFORM_CATEGORIES,
    ready: !!userId,
    api,
  });

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  return (
    ctx || {
      totalUnread: 0,
      byCategory: {},
      items: [],
      loading: false,
      refreshFeed: () => {},
      refreshSummary: () => {},
      markRead: () => {},
      markCategoryRead: () => {},
      markAllRead: () => {},
      markTargetRead: () => {},
    }
  );
}
