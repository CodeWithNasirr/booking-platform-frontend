"use client";

import { Check, X } from "lucide-react";
import { ORDER_TIMELINE_STEPS, orderTimelineCurrent } from "./statusConfig";

/**
 * OrderStatusTimeline — horizontal progress rail showing the order
 * lifecycle. Visual twin of custom-requests/StatusTimeline but
 * driven by the order status machine.
 */
export default function OrderStatusTimeline({ status, className = "" }) {
  if (status === "cancelled" || status === "refunded") {
    const isRefunded = status === "refunded";
    return (
      <div
        className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
          isRefunded
            ? "bg-rose-50 border border-rose-200 text-rose-800"
            : "bg-gray-50 border border-gray-200 text-gray-700"
        } ${className}`}
        role="status"
      >
        <X className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="font-semibold capitalize">{status}</span>
        <span className="text-xs opacity-80">
          {isRefunded ? "This order has been refunded." : "This order has been cancelled."}
        </span>
      </div>
    );
  }

  const current = orderTimelineCurrent(status);
  const active = Math.max(0, ORDER_TIMELINE_STEPS.findIndex((s) => s.key === current));

  return (
    <ol
      className={`flex items-center justify-between gap-1 ${className}`}
      aria-label="Order progress"
    >
      {ORDER_TIMELINE_STEPS.map((step, i) => {
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
            {i < ORDER_TIMELINE_STEPS.length - 1 && (
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
