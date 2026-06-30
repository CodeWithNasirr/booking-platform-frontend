"use client";

import { STATUS_TONE } from "./constants";
import { StatusPill } from "@/components/ui";

const TONE_MAP = {
  pending:     "yellow",
  negotiating: "blue",
  quoted:      "indigo",
  accepted:    "emerald",
  converted:   "purple",
  completed:   "slate",
  rejected:    "rose",
  cancelled:   "gray",
};

/**
 * StatusBadge — backward-compatible thin shim over the
 * design-system StatusPill. Custom-request callers stay
 * untouched while the pill itself benefits from brand-aware
 * focus rings and consistent sizing across the platform.
 */
export default function StatusBadge({ status, size = "md", className = "" }) {
  const tone = TONE_MAP[status] || "gray";
  const label = STATUS_TONE[status]?.label || status;
  return <StatusPill tone={tone} size={size} label={label} className={className} />;
}
