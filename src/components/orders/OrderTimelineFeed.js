"use client";

/**
 * OrderTimelineFeed — chronological list of OrderTimelineEvent rows.
 * Shape mirrors custom-requests/TimelineEvent for visual continuity.
 */

import {
  Circle, CreditCard, UserPlus, PlayCircle, MessageSquare, Paperclip,
  PackageCheck, RefreshCcw, CheckCircle2, XOctagon, ShieldX,
} from "lucide-react";

const ICON_BY_EVENT = {
  order_created:       Circle,
  payment_received:    CreditCard,
  payment_failed:      ShieldX,
  provider_assigned:   UserPlus,
  provider_accepted:   UserPlus,
  provider_declined:   XOctagon,
  work_started:        PlayCircle,
  message_posted:      MessageSquare,
  file_uploaded:       Paperclip,
  delivery_submitted:  PackageCheck,
  revision_requested:  RefreshCcw,
  order_completed:     CheckCircle2,
  order_cancelled:     XOctagon,
  order_refunded:      ShieldX,
  status_changed:      Circle,
};

const LABEL_BY_EVENT = {
  order_created:      "Order created",
  payment_received:   "Payment received",
  payment_failed:     "Payment failed",
  provider_assigned:  "Provider assigned",
  provider_accepted:  "Provider accepted",
  provider_declined:  "Provider declined",
  work_started:       "Work started",
  message_posted:     "Message posted",
  file_uploaded:      "File uploaded",
  delivery_submitted: "Delivery submitted",
  revision_requested: "Revision requested",
  order_completed:    "Order completed",
  order_cancelled:    "Order cancelled",
  order_refunded:     "Order refunded",
  status_changed:     "Status changed",
};

function formatTime(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * variant="rows"   — dense one-line-per-event layout, divider between
 *                    rows. Great for customer/detail pages where you
 *                    just want a scanable activity log.
 * variant="stack"  — original stacked layout with a large brand-tinted
 *                    icon puck for each event. Kept for surfaces that
 *                    treated it like a hero timeline.
 */
export default function OrderTimelineFeed({
  events = [], variant = "rows", className = "",
}) {
  if (!events.length) {
    return (
      <p className={`text-sm text-gray-500 ${className}`}>No activity yet.</p>
    );
  }

  if (variant === "stack") {
    return (
      <ol className={`space-y-3 ${className}`} aria-label="Order timeline">
        {events.map((evt) => {
          const Icon = ICON_BY_EVENT[evt.event] || Circle;
          const label = LABEL_BY_EVENT[evt.event] || evt.event;
          const actor = evt.actor_name || (evt.actor_role === "system" ? "System" : "");
          return (
            <li key={evt.id} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full bg-[color:var(--brand-primary,#3B82F6)]/10 text-[color:var(--brand-primary,#3B82F6)] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{label}</span>
                  {actor && (
                    <span className="text-gray-500"> · {actor}</span>
                  )}
                </p>
                {evt.message_preview && (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{evt.message_preview}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">{formatTime(evt.created_at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ul
      className={`divide-y divide-gray-100 ${className}`}
      aria-label="Order timeline"
    >
      {events.map((evt) => {
        const Icon = ICON_BY_EVENT[evt.event] || Circle;
        const label = LABEL_BY_EVENT[evt.event] || evt.event;
        const actor = evt.actor_name || (evt.actor_role === "system" ? "System" : "");
        return (
          <li
            key={evt.id}
            className="flex items-center gap-3 py-2.5 text-sm"
          >
            <Icon
              className="w-4 h-4 text-[color:var(--brand-primary,#3B82F6)] shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium text-gray-900 truncate">{label}</span>
            {actor && (
              <span className="text-gray-500 hidden sm:inline truncate">· {actor}</span>
            )}
            <span className="ml-auto text-[11px] text-gray-400 shrink-0 tabular-nums">
              {formatTime(evt.created_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
