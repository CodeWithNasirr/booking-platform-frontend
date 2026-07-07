"use client";

import { Check } from "lucide-react";

/**
 * StatusTimeline — compact horizontal progress rail used at the
 * top of the customer portal. Tells the customer where the
 * request is in the workflow in a glance:
 *
 *   ● Submitted ── ● Reviewing ── ● Quoted ── ● Accepted
 *
 * Reads the tenant accent from the brand CSS variable so the
 * "current" indicator inherits the right colour.
 *
 * The rail collapses to vertical on narrow mobile (sub-360 px)
 * where horizontal labels would overlap.
 */

const STEPS = [
  { key: "submitted",   label: "Submitted",  matches: ["pending"] },
  { key: "reviewing",   label: "Reviewing",  matches: ["negotiating"] },
  { key: "quoted",      label: "Quoted",     matches: ["quoted"] },
  { key: "accepted",    label: "Accepted",   matches: ["accepted", "converted", "completed"] },
];

function activeIndex(status) {
  const idx = STEPS.findIndex((s) => s.matches.includes(status));
  return idx >= 0 ? idx : 0;
}

export default function StatusTimeline({ status, className = "" }) {
  // Terminal off-track statuses (rejected / cancelled) render
  // their own banner — don't try to fake a rail for them.
  if (status === "rejected" || status === "cancelled") {
    const isRejected = status === "rejected";
    return (
      <div
        className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
          isRejected
            ? "bg-rose-50 border border-rose-200 text-rose-800"
            : "bg-gray-50 border border-gray-200 text-gray-700"
        } ${className}`}
        role="status"
      >
        <span className="font-semibold capitalize">{status}</span>
        <span className="text-xs opacity-80">
          {isRejected
            ? "This request was declined by the team."
            : "This request has been cancelled."}
        </span>
      </div>
    );
  }

  const active = activeIndex(status);

  return (
    <ol
      className={`flex items-center justify-between gap-1 ${className}`}
      aria-label="Request progress"
    >
      {STEPS.map((step, i) => {
        const isDone = i < active;
        const isCurrent = i === active;
        return (
          <li
            key={step.key}
            className="flex-1 flex items-center min-w-0"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1 min-w-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                  isDone
                    ? "bg-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary-fg,#fff)]"
                    : isCurrent
                      ? "bg-[color:var(--brand-primary,#3B82F6)]/15 text-[color:var(--brand-primary,#3B82F6)] ring-2 ring-[color:var(--brand-primary,#3B82F6)]/40"
                      : "bg-gray-100 text-gray-400"
                }`}
                aria-hidden="true"
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-wide truncate max-w-[5.5rem] sm:max-w-none ${
                  isCurrent ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`flex-1 h-px mx-1 sm:mx-2 ${
                  isDone ? "bg-[color:var(--brand-primary,#3B82F6)]/70" : "bg-gray-200"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
