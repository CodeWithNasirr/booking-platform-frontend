"use client";

import { TIMELINE_LABELS } from "./constants";

export default function TimelineEvent({ item }) {
  const label = TIMELINE_LABELS[item.event] || item.event;
  const from = item.metadata?.from;
  const to = item.metadata?.to;
  return (
    <div className="flex items-center gap-2 my-2 text-[11px] text-gray-500">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200">
        {label}
        {from && to && <> · {from} → {to}</>}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
