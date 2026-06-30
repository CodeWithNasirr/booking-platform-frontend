"use client";

/**
 * PostAcceptanceCard (V3.F.11)
 *
 * Shared next-step card used by all three roles. The visual
 * shape, brand-tinted card, icon block, and CTA button are
 * identical — only the title / body / CTA copy changes per
 * viewer so the customer, tenant admin, and provider each
 * see the right message for their role at every status.
 *
 * Props:
 *   request       — full request payload
 *   order         — optional order summary (silent fallback)
 *   orderHref     — host-computed CTA destination
 *   providerName  — copy substitution (used by customer view)
 *   customerName  — copy substitution (used by admin + provider)
 *   viewer        — "customer" | "admin" | "provider"
 *                   defaults to "customer" for backward compat
 *   className     — host-level layout overrides
 */

import Link from "next/link";
import {
  ArrowRight, CheckCircle2, CreditCard, Hourglass, PackageCheck,
  PlayCircle, ShieldX, XOctagon,
} from "lucide-react";

import { Card, Button } from "@/components/ui";

const ORDER_LABEL = {
  pending_payment: "Payment pending",
  paid:           "Paid",
  in_progress:    "In progress",
  delivered:      "Delivered for review",
  completed:      "Completed",
  cancelled:      "Cancelled",
  refunded:       "Refunded",
};

const ORDER_TONE = {
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  paid:           "bg-blue-50 text-blue-700 border-blue-200",
  in_progress:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed:      "bg-slate-50 text-slate-700 border-slate-200",
  cancelled:      "bg-rose-50 text-rose-700 border-rose-200",
  refunded:       "bg-gray-50 text-gray-700 border-gray-200",
};

function pickVariant(requestStatus, orderStatus) {
  if (requestStatus === "rejected") return "rejected";
  if (requestStatus === "cancelled") return "cancelled";
  if (requestStatus === "completed") return "wrapped";
  if (requestStatus !== "converted") return null;
  if (!orderStatus) return "generic";
  if (orderStatus === "pending_payment") return "pay";
  if (orderStatus === "paid") return "start";
  if (orderStatus === "in_progress") return "working";
  if (orderStatus === "delivered") return "review";
  if (orderStatus === "completed") return "wrapped";
  return "generic";
}

const ICON_BY_VARIANT = {
  pay:     CreditCard,
  start:   PlayCircle,
  working: Hourglass,
  review:  PackageCheck,
  wrapped: CheckCircle2,
  generic: ArrowRight,
};

// Per-viewer copy. Each row is { title, body, cta }. Strings can
// include {provider} / {customer} tokens that resolve from props.
const COPY = {
  customer: {
    pay:     { title: "Complete your payment", body: "Your order is ready. Pay to start work — you'll get an email confirmation right after.", cta: "Pay now" },
    start:   { title: "{provider} is starting your work", body: "We'll let you know the moment the delivery is ready for your review.", cta: "Track order" },
    working: { title: "{provider} is working on this", body: "We'll let you know the moment the delivery is ready for your review.", cta: "Track order" },
    review:  { title: "Your delivery is ready", body: "Check the files on your order page and either accept or request a revision.", cta: "Review delivery" },
    wrapped: { title: "All wrapped up", body: "Your order is complete. Thanks for working with the team.", cta: "View order" },
    generic: { title: "Your request is now an order", body: "Continue on the order page to pay, track, or review your delivery.", cta: "Open order" },
  },
  admin: {
    pay:     { title: "Awaiting customer payment", body: "{customer} has accepted the quote — work starts as soon as payment lands.", cta: "View order" },
    start:   { title: "{customer} paid — work can begin", body: "{provider} is ready to start. The order shows the timeline and files.", cta: "Open order" },
    working: { title: "Order in progress with {provider}", body: "Work is underway. Track delivery and provider messages on the order page.", cta: "Open order" },
    review:  { title: "Delivery sent — awaiting customer review", body: "{provider} marked the order delivered. The customer is reviewing now.", cta: "Open order" },
    wrapped: { title: "All wrapped up", body: "The order is complete. Conversation stays available for reference.", cta: "View order" },
    generic: { title: "Order created", body: "This request has been converted to an order. Manage it from the order page.", cta: "Open order" },
  },
  provider: {
    pay:     { title: "Waiting for customer payment", body: "{customer} hasn't paid yet. You'll see this update the moment the order is paid.", cta: "View order" },
    start:   { title: "{customer} paid — start work", body: "Open the order to begin. Mark it in progress when you start.", cta: "Open order" },
    working: { title: "Work in progress", body: "Keep the order updated as you progress so {customer} sees live status.", cta: "Open order" },
    review:  { title: "Delivery sent — awaiting review", body: "{customer} is reviewing your delivery. You'll be notified if they request changes.", cta: "Open order" },
    wrapped: { title: "Order completed", body: "Nice work — this order is done.", cta: "View order" },
    generic: { title: "Order assigned", body: "An order has been created from this request. Track it on the order page.", cta: "Open order" },
  },
};

function fillCopy(template, { providerName, customerName }) {
  if (!template) return "";
  return template
    .replace(/\{provider\}/g, providerName || "the team")
    .replace(/\{customer\}/g, customerName || "the customer");
}

export default function PostAcceptanceCard({
  request,
  order,
  orderHref,
  providerName,
  customerName,
  viewer = "customer",
  className = "",
}) {
  const variant = pickVariant(request?.status, order?.status);
  if (!variant) return null;

  // Rejected / cancelled — tonal banners read the same across
  // every role; nothing role-specific to surface.
  if (variant === "rejected") {
    return (
      <Card padding="lg" className={`!bg-rose-50 !border-rose-200 ${className}`}>
        <div className="flex items-start gap-3">
          <ShieldX className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-900">This request was declined</p>
            <p className="text-sm text-rose-800/80 mt-1">
              {viewer === "customer"
                ? "The team couldn't move ahead with this one. Feel free to start a new request if your needs have changed."
                : "This request has been declined. The conversation stays available for reference."}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "cancelled") {
    return (
      <Card padding="lg" className={`!bg-gray-50 !border-gray-200 ${className}`}>
        <div className="flex items-start gap-3">
          <XOctagon className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">This request was cancelled</p>
            <p className="text-sm text-gray-600 mt-1">
              No further action needed. The conversation stays available for reference.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const copy = (COPY[viewer] || COPY.customer)[variant];
  const Icon = ICON_BY_VARIANT[variant] || ArrowRight;
  const orderStatusLabel = order ? ORDER_LABEL[order.status] : null;
  const orderStatusTone = order ? ORDER_TONE[order.status] : null;

  const title = fillCopy(copy.title, { providerName, customerName });
  const body = fillCopy(copy.body, { providerName, customerName });

  return (
    <Card
      padding="lg"
      className={`!bg-[color:var(--brand-primary,#3B82F6)]/5 !border-[color:var(--brand-primary,#3B82F6)]/20 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-xl bg-[color:var(--brand-primary,#3B82F6)]/15 text-[color:var(--brand-primary,#3B82F6)] flex items-center justify-center shrink-0"
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {orderStatusLabel && (
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${orderStatusTone}`}>
                {orderStatusLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{body}</p>

          {order?.total_amount && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              {order.currency || ""} {order.total_amount}
              {order.order_number && (
                <span className="ml-2 text-gray-400">· #{order.order_number}</span>
              )}
            </p>
          )}

          {orderHref && (
            <div className="mt-4">
              <Button
                as={Link}
                href={orderHref}
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {copy.cta}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
