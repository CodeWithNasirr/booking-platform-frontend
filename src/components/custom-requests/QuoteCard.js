"use client";

import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Card, Button } from "@/components/ui";

/**
 * QuoteCard — current offer + revision history + viewer actions.
 *
 * Brand-aware: the price colour, accept button, and dashed
 * focus rings inherit the tenant accent via the brand CSS
 * variables — no more hard-coded primary colour prop.
 *
 * Host-driven actions: pass canAccept / canReject / canCounter
 * to expose the customer-side affordances. Provider and tenant
 * admin pass none → read-only display.
 */
export default function QuoteCard({
  quote,
  canAccept = false,
  canReject = false,
  canCounter = false,
  disabled = false,
  onAccept, onReject, onCounter,
}) {
  if (!quote) return null;
  const versions = quote.revisions_history || [];
  const showActions = (canAccept || canReject || canCounter) &&
    (quote.status === "pending" || quote.status === "countered");

  return (
    <Card padding="lg" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
          Current quote
        </h2>
        <span className="text-[10px] text-gray-400">
          {versions.length > 0 ? `Version ${versions.length}` : ""}
        </span>
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-extrabold text-[color:var(--brand-primary,#3B82F6)]">
          {quote.currency} {quote.price}
        </span>
        <span className="text-sm text-gray-500">{quote.delivery_days} days</span>
        {quote.revisions > 0 && (
          <span className="text-sm text-gray-500">· {quote.revisions} revisions</span>
        )}
        <span className="text-xs text-gray-400 capitalize ml-auto">{quote.status}</span>
      </div>
      {quote.message && (
        <p className="text-sm text-gray-700 whitespace-pre-line">{quote.message}</p>
      )}

      {versions.length > 1 && (
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800">
            Show version history
          </summary>
          <ol className="mt-2 space-y-1.5">
            {versions.map((r) => (
              <li key={r.id} className="border-l-2 border-gray-200 pl-2">
                <span className="font-medium">v{r.version}</span>
                {" — "}{r.currency} {r.price} · {r.delivery_days}d
                {r.message && (
                  <p className="text-gray-500 whitespace-pre-line">{r.message}</p>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}

      {showActions && (
        <div className="flex flex-wrap gap-2 pt-1">
          {canAccept && (
            <Button
              variant="primary" size="md"
              onClick={onAccept}
              disabled={disabled}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Accept
            </Button>
          )}
          {canCounter && (
            <Button
              variant="secondary" size="md"
              onClick={onCounter}
              disabled={disabled}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Ask for revision
            </Button>
          )}
          {canReject && (
            <Button
              variant="danger" size="md"
              onClick={onReject}
              disabled={disabled}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Decline
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
