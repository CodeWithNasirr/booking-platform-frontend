"use client";

import { STATUS_TONE } from "./constants";

export default function StatusBadge({ status, size = "md", className = "" }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.pending;
  const sizing = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${tone.chip} ${sizing} ${className}`}
    >
      {tone.label}
    </span>
  );
}
