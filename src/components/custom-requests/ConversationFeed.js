"use client";

/**
 * ConversationFeed (V3.F.5)
 *
 * What it does that V3.F.4 didn't:
 *
 *   - Day separators between messages on different calendar days
 *     ("Today" / "Yesterday" / "Mon, Jun 23").
 *   - "Jump to latest" floating pill when the user has scrolled
 *     up and new messages arrive. Counts arrivals while away.
 *   - Optional `pendingMessages` prop renders extra optimistic
 *     bubbles at the end with state="pending".
 *
 * Auto-scroll behaviour: tail-follows when the user is at the
 * bottom; stays put when they've scrolled up.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";

import ConversationBubble from "./ConversationBubble";
import TimelineEvent from "./TimelineEvent";
import ChatAttachment from "@/components/shared/ChatAttachment";
import { buildFeed } from "./constants";

const GROUP_WINDOW_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

// Walk up the DOM looking for the closest scroll container. The
// jump-to-latest observer roots itself on this element so it
// reacts to scrolls within the conversation column (CRM right
// pane) AND scrolls of the page itself (customer portal).
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

export default function ConversationFeed({ request, viewer = "customer", pendingMessages = [] }) {
  const items = useMemo(
    () => buildItems(request, pendingMessages),
    [request, pendingMessages],
  );

  const endRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevLengthRef = useRef(items.length);

  // Jump-to-latest observer. Reroots itself once the DOM is
  // mounted; cleans up between renders cleanly.
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

  // Auto-scroll only when the user is at the bottom; otherwise
  // bump the new-count badge.
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
    return (
      <div className="text-sm text-gray-500 text-center py-10">
        <p className="font-medium text-gray-600">Nothing here yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Once a message lands it shows up here in real time.
        </p>
      </div>
    );
  }

  // Render: walk the items inserting day separators + applying
  // same-author grouping rules. `prev` carries the last rendered
  // message so grouping logic stays accurate across separators.
  let prevDay = null;
  let prevMessage = null;
  const out = [];
  for (const item of items) {
    const day = startOfDay(item.at);
    if (day !== prevDay) {
      out.push(
        <DaySeparator key={`d-${day}`} when={item.at} />
      );
      prevDay = day;
      // Reset grouping after a day boundary — the next message
      // should always render its header.
      prevMessage = null;
    }

    if (item.kind === "system") {
      out.push(<TimelineEvent key={item.key} item={item} />);
      prevMessage = null;
      continue;
    }

    if (item.kind === "attachment") {
      // Align the attachment like a chat bubble: the viewer's own uploads on
      // one side, the other participant's on the other.
      const mine =
        (viewer === "customer" && item.author_role === "customer") ||
        (viewer !== "customer" && item.author_role !== "customer");
      out.push(
        <div
          key={item.key}
          className={`flex my-1.5 ${mine ? "justify-end" : "justify-start"}`}
        >
          <ChatAttachment attachment={item.attachment} />
        </div>
      );
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
      />
    );
    prevMessage = item;
  }

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
