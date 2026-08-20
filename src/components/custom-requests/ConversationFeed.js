"use client";

/**
 * ConversationFeed
 *
 * The shared message thread used by every chat surface (customer,
 * tenant/CRM, provider) across Bookings, Orders and Custom Requests.
 *
 * Two layout modes:
 *
 *   fill = true  (recommended for every bounded chat panel)
 *     ConversationFeed OWNS the scroll container. It renders a
 *     `relative flex-1 min-h-0` wrapper with an `absolute inset-0`
 *     scroller inside — a layout that is immune to flexbox min-height
 *     quirks, so the message list always gets a real, bounded height
 *     and scrolls independently of the page. The host is responsible
 *     only for giving the panel a height (e.g. a fixed-height flex
 *     column) and placing the composer as a sibling BELOW the feed.
 *
 *   fill = false (legacy / page-scroll callers)
 *     The feed grows with its content and the nearest scrollable
 *     ancestor (or the page) does the scrolling. Kept for surfaces
 *     that intentionally scroll the whole page.
 *
 * Scroll behaviour (fill mode — professional messaging UX):
 *   - On open: jump straight to the latest message (no smooth flash).
 *   - Independent, touch-friendly scrolling with `overscroll-contain`
 *     so reaching the top/bottom never scrolls the page behind it.
 *   - New message while the user is near the bottom → follow to bottom.
 *   - New message while the user has scrolled up → DON'T yank them
 *     down; show a "New messages" pill instead.
 *   - ResizeObserver keeps the view pinned to the bottom when the
 *     container shrinks (mobile keyboard opening), so the composer and
 *     latest message stay visible.
 *   - All scrolling is scoped to the feed's own element (scrollTo on
 *     the container), never `scrollIntoView`, which would bubble up
 *     and jerk ancestor scrollers / the page.
 */

import {
  useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback,
} from "react";
import { ArrowDown } from "lucide-react";

import ConversationBubble from "./ConversationBubble";
import TimelineEvent from "./TimelineEvent";
import { buildFeed } from "./constants";

const GROUP_WINDOW_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// How close to the bottom (px) still counts as "at the bottom" for
// the purpose of auto-following new messages.
const NEAR_BOTTOM_PX = 96;

// useLayoutEffect warns during SSR; fall back to useEffect on the
// server so the initial scroll-to-bottom stays flash-free on the client.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function startOfDay(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(iso) {
  const today = startOfDay(new Date().toISOString());
  const that = startOfDay(iso);
  const days = Math.round((today - that) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(iso).toLocaleDateString(undefined, { weekday: "long" });
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

// Walk up the DOM looking for the closest scroll container. Only used
// by the legacy (fill=false) page-scroll path.
function findScrollParent(el) {
  let p = el?.parentElement;
  while (p) {
    const overflow = getComputedStyle(p).overflowY;
    if (overflow === "auto" || overflow === "scroll") return p;
    p = p.parentElement;
  }
  return null;
}

function buildItems(request, pendingMessages) {
  const items = buildFeed(request);
  for (const p of pendingMessages || []) {
    items.push({
      kind: "message",
      key: `p-${p.id}`,
      at: p.at,
      author_role: p.author_role || "customer",
      author_name: p.author_name || "You",
      msg_kind: "message",
      body: p.body,
      _state: "pending",
    });
  }
  items.sort((a, b) => new Date(a.at) - new Date(b.at));
  return items;
}

// Render the items into an array of nodes, inserting day separators
// and applying same-author grouping. Shared by both layout modes.
function renderItems(items, viewer) {
  let prevDay = null;
  let prevMessage = null;
  const out = [];
  for (const item of items) {
    const day = startOfDay(item.at);
    if (day !== prevDay) {
      out.push(<DaySeparator key={`d-${day}`} when={item.at} />);
      prevDay = day;
      prevMessage = null;
    }

    if (item.kind === "system") {
      out.push(<TimelineEvent key={item.key} item={item} />);
      prevMessage = null;
      continue;
    }

    const grouped =
      prevMessage &&
      prevMessage.author_role === item.author_role &&
      prevMessage.author_name === item.author_name &&
      item.msg_kind !== "info_request" &&
      prevMessage.msg_kind !== "info_request" &&
      new Date(item.at) - new Date(prevMessage.at) < GROUP_WINDOW_MS;

    out.push(
      <ConversationBubble
        key={item.key}
        item={item}
        viewer={viewer}
        grouped={grouped}
        state={item._state}
      />,
    );
    prevMessage = item;
  }
  return out;
}

function DefaultEmpty() {
  return (
    <div className="text-sm text-gray-500 text-center py-10">
      <p className="font-medium text-gray-600">Nothing here yet</p>
      <p className="text-xs text-gray-400 mt-1">
        Once a message lands it shows up here in real time.
      </p>
    </div>
  );
}

export default function ConversationFeed({
  request,
  viewer = "customer",
  pendingMessages = [],
  fill = false,
  emptyState = null,
  className = "",
}) {
  const items = useMemo(
    () => buildItems(request, pendingMessages),
    [request, pendingMessages],
  );

  if (fill) {
    return (
      <FillFeed items={items} viewer={viewer} emptyState={emptyState} className={className} />
    );
  }
  return (
    <LegacyFeed items={items} viewer={viewer} emptyState={emptyState} />
  );
}

// ─── fill mode: self-owned, bounded, independently-scrolling ───

function FillFeed({ items, viewer, emptyState, className }) {
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const nearBottomRef = useRef(true);
  const prevLenRef = useRef(0);
  const initedRef = useRef(false);

  const [showPill, setShowPill] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  }, []);

  // Pure DOM scroll — no setState, so it's safe to call from effects.
  // The pill state is reset by the scroll handler once the smooth
  // scroll actually reaches the bottom.
  const scrollToBottom = useCallback((smooth) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    nearBottomRef.current = true;
  }, []);

  // Called from the click handler / scroll events (never an effect).
  const dismissPill = useCallback(() => {
    setShowPill(false);
    setNewCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const nb = isNearBottom();
    nearBottomRef.current = nb;
    if (nb) dismissPill();
  }, [isNearBottom, dismissPill]);

  // On first population, jump straight to the latest message before
  // paint so the thread opens at the bottom with no upward flash.
  useIsoLayoutEffect(() => {
    if (initedRef.current || items.length === 0) return;
    scrollToBottom(false);
    prevLenRef.current = items.length;
    initedRef.current = true;
  }, [items.length, scrollToBottom]);

  // On growth, follow to the bottom only if the user was already near
  // it; otherwise surface the "New messages" pill.
  useEffect(() => {
    if (!initedRef.current) return;
    const delta = items.length - prevLenRef.current;
    prevLenRef.current = items.length;
    if (delta <= 0) return;
    if (nearBottomRef.current) {
      // Already at the bottom → follow the new message down (DOM only).
      scrollToBottom(true);
    } else {
      // Scrolled up → don't yank; surface the "New messages" pill.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPill(true);
      setNewCount((c) => c + delta);
    }
  }, [items.length, scrollToBottom]);

  // Keep pinned to the bottom when the container shrinks (mobile
  // keyboard opening / viewport resize) so the composer and latest
  // message never get hidden.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => {
      if (nearBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const out = useMemo(() => renderItems(items, viewer), [items, viewer]);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`absolute inset-0 overflow-y-auto overscroll-contain ${className}`}
      >
        {items.length === 0 ? (
          emptyState || <DefaultEmpty />
        ) : (
          <div className="space-y-0.5">
            {out}
            <div ref={endRef} aria-hidden="true" />
          </div>
        )}
      </div>

      {showPill && newCount > 0 && (
        <button
          onClick={() => { scrollToBottom(true); dismissPill(); }}
          className="absolute left-1/2 -translate-x-1/2 bottom-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/50"
          aria-label={`Jump to ${newCount} new message${newCount === 1 ? "" : "s"}`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
          {newCount} new {newCount === 1 ? "message" : "messages"}
        </button>
      )}
    </div>
  );
}

// ─── legacy mode: grows with content, page/ancestor does the scroll ───

function LegacyFeed({ items, viewer, emptyState }) {
  const endRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevLengthRef = useRef(items.length);

  useEffect(() => {
    const target = endRef.current;
    if (!target) return undefined;
    const root = findScrollParent(target) || null;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setAtBottom(true);
            setNewCount(0);
          } else {
            setAtBottom(false);
          }
        }
      },
      { root, threshold: 0.01 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const delta = items.length - prevLengthRef.current;
    prevLengthRef.current = items.length;
    if (delta <= 0) return;
    if (atBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      setNewCount((c) => c + delta);
    }
  }, [items.length, atBottom]);

  const jumpToLatest = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  if (items.length === 0) {
    return emptyState || <DefaultEmpty />;
  }

  const out = renderItems(items, viewer);

  return (
    <div className="relative">
      <div className="space-y-0.5">
        {out}
        <div ref={endRef} aria-hidden="true" />
      </div>

      {!atBottom && newCount > 0 && (
        <button
          onClick={jumpToLatest}
          className="absolute left-1/2 -translate-x-1/2 bottom-2 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/50"
          aria-label={`Jump to ${newCount} new message${newCount === 1 ? "" : "s"}`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
          {newCount} new {newCount === 1 ? "message" : "messages"}
        </button>
      )}
    </div>
  );
}

function DaySeparator({ when }) {
  return (
    <div className="flex items-center gap-2 my-4 text-[11px] text-gray-500" role="separator">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 font-medium text-gray-600">
        {dayLabel(when)}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
