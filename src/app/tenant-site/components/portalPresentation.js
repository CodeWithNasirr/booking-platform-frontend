"use client";

import { CalendarClock, Loader2, CheckCircle2 } from "lucide-react";

// Booking status → semantic StatusPill tone + label.
export const STATUS_META = {
  draft:            { tone: "neutral", label: "Draft" },
  pending:          { tone: "warning", label: "Pending" },
  pending_payment:  { tone: "warning", label: "Pending payment" },
  paid:             { tone: "info",    label: "Paid" },
  confirmed:        { tone: "info",    label: "Confirmed" },
  scheduled:        { tone: "info",    label: "Scheduled" },
  in_progress:      { tone: "brand",   label: "In progress" },
  completed:        { tone: "success", label: "Completed" },
  cancelled:        { tone: "danger",  label: "Cancelled" },
  refunded:         { tone: "neutral", label: "Refunded" },
};

export function statusMeta(status) {
  return STATUS_META[status] || { tone: "neutral", label: (status || "unknown").replace(/_/g, " ") };
}

// Summary buckets for the portal (Upcoming / Active / Completed).
export const UPCOMING_STATUSES = ["pending", "pending_payment", "paid", "confirmed", "scheduled"];
export const ACTIVE_STATUSES = ["in_progress"];

export const SUMMARY_CARDS = [
  { key: "upcoming", label: "Upcoming", icon: CalendarClock, chip: "bg-info-soft text-info-soft-foreground", match: (b) => UPCOMING_STATUSES.includes(b.status) },
  { key: "active", label: "Active", icon: Loader2, chip: "bg-accent text-accent-foreground", match: (b) => ACTIVE_STATUSES.includes(b.status) },
  { key: "completed", label: "Completed", icon: CheckCircle2, chip: "bg-success-soft text-success-soft-foreground", match: (b) => b.status === "completed" },
];

export function paymentMeta(b) {
  if (b.status === "refunded") return { tone: "neutral", label: "Refunded" };
  const total = parseFloat(b.total_amount || 0);
  const paid = b.amount_paid != null ? parseFloat(b.amount_paid) : null;
  if (b.is_fully_paid || (total > 0 && paid != null && paid >= total)) return { tone: "soft-success", label: "Paid" };
  if (b.is_deposit_paid || (paid != null && paid > 0)) return { tone: "soft-warning", label: "Partial" };
  return { tone: "soft-danger", label: "Unpaid" };
}

export function isOnline(b) {
  return Boolean(b.meeting_url || b.meeting_provider || b.is_online);
}

export function unreadCount(b) {
  return b.unread_count ?? b.unread_messages_count ?? (b.has_unread ? 1 : 0) ?? 0;
}

export function fmtMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(parseFloat(amount || 0));
  } catch {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
  }
}

export function fmtDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function fmtTime(s) {
  if (!s) return null;
  const [h, m] = String(s).split(":");
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m || "0", 10));
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

export function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
