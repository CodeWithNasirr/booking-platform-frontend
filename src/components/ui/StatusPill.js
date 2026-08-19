"use client";

/**
 * StatusPill — domain-agnostic status indicator.
 *
 * Prefer the semantic tones (success / warning / danger / info /
 * neutral / brand) — they map onto the design tokens so status
 * colour stays consistent across every surface and both themes.
 * The legacy colour names (yellow / emerald / rose / blue …) are
 * kept as aliases so existing call sites keep working.
 */

const TONES = {
  // Semantic (preferred)
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  danger: "bg-danger-soft text-danger-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  brand: "bg-accent text-accent-foreground",
  neutral: "bg-muted text-muted-foreground",

  // Legacy aliases → semantic tokens
  emerald: "bg-success-soft text-success-soft-foreground",
  green: "bg-success-soft text-success-soft-foreground",
  yellow: "bg-warning-soft text-warning-soft-foreground",
  amber: "bg-warning-soft text-warning-soft-foreground",
  rose: "bg-danger-soft text-danger-soft-foreground",
  red: "bg-danger-soft text-danger-soft-foreground",
  blue: "bg-info-soft text-info-soft-foreground",
  gray: "bg-muted text-muted-foreground",
  slate: "bg-muted text-muted-foreground",

  // Kept distinct (no semantic token yet — see Phase 2)
  indigo: "bg-indigo-100 text-indigo-800",
  purple: "bg-purple-100 text-purple-800",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
};

export default function StatusPill({
  tone = "neutral", size = "md", label, dot = false, className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${TONES[tone] || TONES.neutral} ${SIZES[size] || SIZES.md} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      {label}
    </span>
  );
}
