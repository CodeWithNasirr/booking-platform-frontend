"use client";

/**
 * StatusPill — domain-agnostic status indicator. The
 * custom-requests StatusBadge will rewire onto this; orders /
 * bookings / support can do the same with their own tone maps.
 */

const TONES = {
  yellow:  "bg-yellow-100 text-yellow-800",
  blue:    "bg-blue-100 text-blue-800",
  indigo:  "bg-indigo-100 text-indigo-800",
  emerald: "bg-emerald-100 text-emerald-800",
  purple:  "bg-purple-100 text-purple-800",
  slate:   "bg-slate-100 text-slate-800",
  rose:    "bg-rose-100 text-rose-800",
  gray:    "bg-gray-100 text-gray-700",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
};

export default function StatusPill({
  tone = "gray", size = "md", label, dot = false, className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${TONES[tone] || TONES.gray} ${SIZES[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-60`} />}
      {label}
    </span>
  );
}
