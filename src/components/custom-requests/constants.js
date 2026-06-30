// src/components/custom-requests/constants.js
//
// Single source of truth for status tone, labels, and timeline
// labelling across the customer portal, tenant CRM, and provider
// panel. Pages should import from here instead of redeclaring
// their own STATUS_CONFIG / TIMELINE_LABELS.

export const STATUS_TONE = {
  pending:     { dot: "bg-yellow-400",  chip: "bg-yellow-100 text-yellow-800",   label: "Pending" },
  negotiating: { dot: "bg-blue-400",    chip: "bg-blue-100 text-blue-800",       label: "Negotiating" },
  quoted:      { dot: "bg-indigo-400",  chip: "bg-indigo-100 text-indigo-800",   label: "Quoted" },
  accepted:    { dot: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-800", label: "Accepted" },
  converted:   { dot: "bg-purple-400",  chip: "bg-purple-100 text-purple-800",   label: "Converted" },
  completed:   { dot: "bg-slate-400",   chip: "bg-slate-100 text-slate-800",     label: "Completed" },
  rejected:    { dot: "bg-rose-400",    chip: "bg-rose-100 text-rose-800",       label: "Rejected" },
  cancelled:   { dot: "bg-gray-400",    chip: "bg-gray-100 text-gray-700",       label: "Cancelled" },
};

export const TERMINAL_STATUSES = new Set([
  "accepted", "converted", "completed", "rejected", "cancelled",
]);

// Bubble entity types (message_posted, info_requested) render as
// chat bubbles in the conversation feed — the timeline row is
// suppressed for those. Everything else renders as a system block.
export const TIMELINE_LABELS = {
  request_created:     "Request created",
  provider_assigned:   "Provider assigned",
  provider_unassigned: "Provider unassigned",
  quote_submitted:     "Quote submitted",
  quote_updated:       "Quote updated",
  quote_accepted:      "Quote accepted",
  quote_rejected:      "Quote declined",
  quote_countered:     "Revision requested",
  message_posted:      null,
  info_requested:      null,
  file_uploaded:       "File uploaded",
  status_changed:      "Status changed",
  order_created:       "Order created",
  request_rejected:    "Request declined",
  request_cancelled:   "Request cancelled",
};

export function buildFeed(request) {
  if (!request) return [];
  const items = [];
  for (const m of request.messages || []) {
    items.push({
      kind: "message",
      key: `m-${m.id}`,
      at: m.created_at,
      author_role: m.author_role || "customer",
      author_name: m.author_name || m.author_email || "—",
      msg_kind: m.kind,
      body: m.body,
    });
  }
  for (const ev of request.timeline || []) {
    if (TIMELINE_LABELS[ev.event] === null) continue;
    items.push({
      kind: "system",
      key: `t-${ev.id}`,
      at: ev.created_at,
      event: ev.event,
      actor_role: ev.actor_role,
      metadata: ev.metadata || {},
    });
  }
  items.sort((a, b) => new Date(a.at) - new Date(b.at));
  return items;
}
