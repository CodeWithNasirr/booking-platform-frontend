"use client";

import { useMemo, useRef, useEffect } from "react";

import ConversationBubble from "./ConversationBubble";
import TimelineEvent from "./TimelineEvent";
import { buildFeed } from "./constants";

// Two same-author messages within this window collapse into a
// single grouped block (no repeated header). Big enough to coalesce
// a flurry, small enough that "5 minutes later" gets its own header.
const GROUP_WINDOW_MS = 2 * 60 * 1000;

/**
 * ConversationFeed — merged message + timeline rendering used by
 * every role. Consecutive same-author bubbles collapse so the
 * thread reads like Intercom / iMessage rather than a stack of
 * stamped cards.
 */
export default function ConversationFeed({ request, viewer = "customer" }) {
  const feed = useMemo(() => buildFeed(request), [request]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length]);

  if (feed.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-10">
        <p className="font-medium text-gray-600">Nothing here yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Once a message lands it shows up here in real time.
        </p>
      </div>
    );
  }

  let prev = null;
  return (
    <div className="space-y-0.5">
      {feed.map((item) => {
        if (item.kind === "system") {
          prev = item;
          return <TimelineEvent key={item.key} item={item} />;
        }
        const grouped =
          prev &&
          prev.kind === "message" &&
          prev.author_role === item.author_role &&
          prev.author_name === item.author_name &&
          item.msg_kind !== "info_request" &&
          prev.msg_kind !== "info_request" &&
          new Date(item.at) - new Date(prev.at) < GROUP_WINDOW_MS;
        prev = item;
        return (
          <ConversationBubble
            key={item.key}
            item={item}
            viewer={viewer}
            grouped={grouped}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
