"use client";

import { useMemo, useRef, useEffect } from "react";

import ConversationBubble from "./ConversationBubble";
import TimelineEvent from "./TimelineEvent";
import { buildFeed } from "./constants";

/**
 * ConversationFeed — merged message + timeline rendering used by
 * every view. The container is responsible for scroll behaviour
 * + sticky composer; this component just lays out the items.
 */
export default function ConversationFeed({ request, viewer = "customer" }) {
  const feed = useMemo(() => buildFeed(request), [request]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length]);

  if (feed.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-6">No activity yet.</p>;
  }

  return (
    <div className="space-y-2">
      {feed.map((item) =>
        item.kind === "system"
          ? <TimelineEvent key={item.key} item={item} />
          : <ConversationBubble key={item.key} item={item} viewer={viewer} />
      )}
      <div ref={endRef} />
    </div>
  );
}
