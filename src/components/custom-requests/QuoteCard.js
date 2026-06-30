"use client";

import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

/**
 * QuoteCard — current offer + revision history disclosure +
 * customer/admin actions. Reused by every detail view; the host
 * passes which actions are allowed.
 *
 * Props:
 *   quote              — full ServiceQuoteSerializer payload
 *   primary            — accent colour
 *   canAccept / canReject / canCounter
 *   disabled           — visually disable buttons (locked status)
 *   onAccept / onReject / onCounter
 */
export default function QuoteCard({
  quote,
  primary = "#3B82F6",
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
          Current quote
        </h2>
        <span className="text-[10px] text-gray-400">
          {versions.length > 0 ? `Version ${versions.length}` : ""}
        </span>
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-extrabold" style={{ color: primary }}>
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
            <button
              onClick={onAccept}
              disabled={disabled}
              className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-1"
              style={{ backgroundColor: primary }}
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
          )}
          {canCounter && (
            <button
              onClick={onCounter}
              disabled={disabled}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Ask for revision
            </button>
          )}
          {canReject && (
            <button
              onClick={onReject}
              disabled={disabled}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-medium hover:bg-rose-50 disabled:opacity-50 inline-flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          )}
        </div>
      )}
    </div>
  );
}
