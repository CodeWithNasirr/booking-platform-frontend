// src/components/orders/statusConfig.js
//
// Single source of truth for order status labels + StatusPill tones.
// Used by OrderStatusBadge, OrderProgressCard, list rows and any
// other surface that has to render an order status. Mirrors
// custom-requests/constants.js.

export const ORDER_STATUS_TONE = {
  pending_payment:    "yellow",
  paid:               "blue",
  pending_assignment: "yellow",
  accepted:           "indigo",
  in_progress:        "indigo",
  delivered:          "purple",
  revision_requested: "rose",
  completed:          "emerald",
  cancelled:          "rose",
  refunded:           "gray",
};

export const ORDER_STATUS_LABEL = {
  pending_payment:    "Pending payment",
  paid:               "Paid",
  pending_assignment: "Awaiting assignment",
  accepted:           "Accepted",
  in_progress:        "In progress",
  delivered:          "Delivered",
  revision_requested: "Revision requested",
  completed:          "Completed",
  cancelled:          "Cancelled",
  refunded:           "Refunded",
};

// Canonical timeline ordering used by StatusTimeline.
export const ORDER_TIMELINE_STEPS = [
  { key: "pending_payment", label: "Payment" },
  { key: "paid",            label: "Paid" },
  { key: "in_progress",     label: "In progress" },
  { key: "delivered",       label: "Delivered" },
  { key: "completed",       label: "Completed" },
];

export const ORDER_TERMINAL_STATUSES = new Set([
  "completed", "cancelled", "refunded",
]);

// Map a status to which timeline step is "current".
export function orderTimelineCurrent(status) {
  if (status === "accepted" || status === "pending_assignment") return "paid";
  if (status === "revision_requested") return "in_progress";
  if (status === "refunded" || status === "cancelled") return "pending_payment";
  return status;
}
