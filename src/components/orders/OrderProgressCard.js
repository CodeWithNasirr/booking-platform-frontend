"use client";

/**
 * OrderProgressCard
 *
 * Direct order analogue of custom-requests/PostAcceptanceCard. The
 * customer (/my-orders), tenant CRM (/dashboard/orders), and
 * provider (/provider/orders) views all show the same brand-tinted
 * "what happens next" hero — only the per-viewer copy changes.
 *
 * Props:
 *   order        — required; uses .status, .order_number, .currency, .total_amount
 *   viewer       — "customer" | "admin" | "provider" (default "customer")
 *   actionHref   — optional CTA destination
 *   providerName / customerName — copy substitutions
 */

import Link from "next/link";
import {
  ArrowRight, CheckCircle2, CreditCard, Hourglass, PackageCheck,
  PlayCircle, RefreshCcw, ShieldX, XOctagon,
} from "lucide-react";

import { Card, Button } from "@/components/ui";
import OrderStatusBadge from "./OrderStatusBadge";

const ICON_BY_STATUS = {
  pending_payment:    CreditCard,
  pending_assignment: Hourglass,
  paid:               PlayCircle,
  accepted:           PlayCircle,
  in_progress:        Hourglass,
  delivered:          PackageCheck,
  revision_requested: RefreshCcw,
  completed:          CheckCircle2,
  cancelled:          XOctagon,
  refunded:           ShieldX,
};

const COPY = {
  customer: {
    pending_payment:    { title: "Complete your payment", body: "Pay now and we'll start the work straight away — you'll get an email confirmation.", cta: "Pay now" },
    pending_assignment: { title: "Finding the right specialist", body: "We're assigning the best fit for your order. You'll be notified the moment work starts.", cta: "View order" },
    paid:               { title: "{provider} is starting your work", body: "Payment received. We'll let you know the moment the delivery is ready.", cta: "Track order" },
    accepted:           { title: "{provider} accepted your order", body: "Work starts shortly. Track progress on the order page.", cta: "Track order" },
    in_progress:        { title: "{provider} is working on this", body: "We'll notify you the moment your delivery is ready for review.", cta: "Track order" },
    delivered:          { title: "Your delivery is ready", body: "Review the files and either accept or request a revision.", cta: "Review delivery" },
    revision_requested: { title: "Revision requested", body: "We let {provider} know what to adjust. You'll see the new delivery here.", cta: "Track order" },
    completed:          { title: "All wrapped up", body: "Your order is complete. Thanks for working with the team.", cta: "View order" },
    cancelled:          { title: "Order cancelled", body: "No further action needed. Conversation stays available for reference.", cta: "View order" },
    refunded:           { title: "Order refunded", body: "We've processed your refund. It may take a few business days to land.", cta: "View order" },
  },
  admin: {
    pending_payment:    { title: "Awaiting customer payment", body: "{customer} hasn't paid yet. Work starts as soon as payment lands.", cta: "Open order" },
    pending_assignment: { title: "Needs a provider", body: "Payment received — assign a specialist to begin work.", cta: "Assign provider" },
    paid:               { title: "Paid — ready to start", body: "{provider} can begin. The order page shows the timeline and files.", cta: "Open order" },
    accepted:           { title: "{provider} accepted", body: "Work begins shortly. Track delivery from the order page.", cta: "Open order" },
    in_progress:        { title: "In progress with {provider}", body: "Work is underway. Customer can see live status updates.", cta: "Open order" },
    delivered:          { title: "Delivery sent — awaiting customer review", body: "{provider} marked the order delivered. The customer is reviewing now.", cta: "Open order" },
    revision_requested: { title: "Customer requested a revision", body: "{provider} should adjust the delivery based on the customer's notes.", cta: "Open order" },
    completed:          { title: "Order completed", body: "Marked complete. Conversation stays available for reference.", cta: "View order" },
    cancelled:          { title: "Order cancelled", body: "Cancellation processed. Issue or follow up on the refund if needed.", cta: "Open order" },
    refunded:           { title: "Order refunded", body: "Refund issued. Conversation stays available for reference.", cta: "Open order" },
  },
  provider: {
    pending_payment:    { title: "Waiting for customer payment", body: "{customer} hasn't paid yet. You'll see this update the moment they do.", cta: "View order" },
    pending_assignment: { title: "Awaiting assignment", body: "This order is in the queue. You'll be notified if it's assigned to you.", cta: "View order" },
    paid:               { title: "{customer} paid — start work", body: "Open the order to begin. Mark it in progress when you start.", cta: "Open order" },
    accepted:           { title: "Order accepted", body: "Begin work and update progress so {customer} sees live status.", cta: "Open order" },
    in_progress:        { title: "Work in progress", body: "Keep the order updated so {customer} sees live status.", cta: "Open order" },
    delivered:          { title: "Delivery sent — awaiting review", body: "{customer} is reviewing. You'll be notified if they request changes.", cta: "Open order" },
    revision_requested: { title: "{customer} requested a revision", body: "Open the order to read their notes and submit the updated delivery.", cta: "Open order" },
    completed:          { title: "Order completed", body: "Nice work — this one is done.", cta: "View order" },
    cancelled:          { title: "Order cancelled", body: "No further action needed.", cta: "View order" },
    refunded:           { title: "Order refunded", body: "Refund was issued for this order.", cta: "View order" },
  },
};

function fillCopy(template, { providerName, customerName }) {
  if (!template) return "";
  return template
    .replace(/\{provider\}/g, providerName || "the team")
    .replace(/\{customer\}/g, customerName || "the customer");
}

export default function OrderProgressCard({
  order,
  viewer = "customer",
  actionHref,
  providerName,
  customerName,
  className = "",
}) {
  if (!order?.status) return null;

  const status = order.status;
  const Icon = ICON_BY_STATUS[status] || ArrowRight;
  const copy = (COPY[viewer] || COPY.customer)[status] || (COPY[viewer] || COPY.customer).pending_payment;

  // Cancelled / refunded — tonal banner, no CTA.
  if (status === "cancelled" || status === "refunded") {
    const tone = status === "cancelled"
      ? "!bg-gray-50 !border-gray-200 text-gray-800"
      : "!bg-rose-50 !border-rose-200 text-rose-900";
    return (
      <Card padding="lg" className={`${tone} ${className}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${status === "refunded" ? "text-rose-600" : "text-gray-500"}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{copy.title}</p>
            <p className="text-sm opacity-80 mt-1">{fillCopy(copy.body, { providerName, customerName })}</p>
          </div>
        </div>
      </Card>
    );
  }

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
            <OrderStatusBadge status={status} size="sm" />
          </div>
          <p className="text-sm text-gray-600 mt-1">{body}</p>

          {order.total_amount && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              {order.currency || ""} {order.total_amount}
              {order.order_number && (
                <span className="ml-2 text-gray-400">· #{order.order_number}</span>
              )}
            </p>
          )}

          {actionHref && (
            <div className="mt-4">
              <Button
                as={Link}
                href={actionHref}
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
