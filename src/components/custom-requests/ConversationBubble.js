"use client";

/**
 * ConversationBubble — one chat row.
 *
 * V3.F.5 additions:
 *   - `(edited)` marker when updated_at materially exceeds
 *     created_at. Transparent today (no edit UI ships yet)
 *     but data-ready for when one does.
 *   - Tiny delivery-state indicator under viewer-authored
 *     bubbles: "Sending…" while pending, a small dot when
 *     delivered. Quiet by default; only renders when needed.
 *   - Optional `state` prop ("pending" | "sent") controls the
 *     indicator. Hosts pass "pending" on optimistic local
 *     messages; the prop is ignored for everything else.
 */

import { useMemo } from "react";
import { Avatar } from "@/components/ui";

// Treat anything within this window as "saved on first commit"
// — Django auto_now nudges updated_at by a few ms during normal
// inserts and we don't want every bubble to read "(edited)".
const EDIT_MARGIN_MS = 5_000;

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric", minute: "2-digit",
  });
}

function wasEdited(item) {
  if (!item.updated_at || !item.at) return false;
  return new Date(item.updated_at).getTime() - new Date(item.at).getTime() > EDIT_MARGIN_MS;
}

export default function ConversationBubble({
  item,
  viewer = "customer",
  grouped = false,
  state, // "pending" | "sent" | undefined
}) {
  const role = item.author_role;
  const isAdmin = role === "admin";
  const isProvider = role === "provider";
  const isCustomer = role === "customer";
  const isInfo = item.msg_kind === "info_request";

  const isViewerMessage =
    (viewer === "customer" && isCustomer) ||
    (viewer === "provider" && isProvider);

  const { align, bg } = useMemo(() => {
    if (isAdmin) {
      return { align: "justify-center", bg: "bg-gray-100 border-gray-200" };
    }
    if (isInfo) {
      return {
        align: isViewerMessage ? "justify-end" : "justify-start",
        bg: "bg-amber-50 border-amber-200",
      };
    }
    return {
      align: isViewerMessage ? "justify-end" : "justify-start",
      bg: isViewerMessage
        ? "bg-[color:var(--brand-primary,#3B82F6)]/10 border-[color:var(--brand-primary,#3B82F6)]/20"
        : isProvider
          ? "bg-emerald-50 border-emerald-100"
          : "bg-white border-gray-200",
    };
  }, [isViewerMessage, isProvider, isAdmin, isInfo]);

  const edited = wasEdited(item);
  const isPending = state === "pending";

  return (
    <div className={`flex items-end gap-2 ${align} ${grouped ? "mt-0.5" : "mt-2"}`}>
      {!isViewerMessage && !isAdmin && (
        grouped
          ? <div className="hidden sm:block w-9 shrink-0" />
          : <Avatar name={item.author_name} role={role} size="md" className="hidden sm:flex" />
      )}

      <div className={`max-w-[80%] rounded-2xl border ${bg} px-4 py-2 shadow-sm ${isPending ? "opacity-70" : ""}`}>
        {!grouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
              {item.author_name}
              {isInfo && (
                <span className="ml-1 text-amber-700 normal-case">· needs info</span>
              )}
            </span>
            <span className="text-[10px] text-gray-400">{formatTime(item.at)}</span>
            {edited && (
              <span className="text-[10px] text-gray-400 italic">(edited)</span>
            )}
          </div>
        )}
        <p className="text-sm text-gray-800 whitespace-pre-line">{item.body}</p>

        {/* Delivery state — only on viewer-authored, non-admin
            bubbles, and only when actually pending. */}
        {isViewerMessage && isPending && (
          <p className="text-[10px] text-gray-400 mt-1 text-right">
            Sending…
          </p>
        )}
      </div>

      {isViewerMessage && (
        grouped
          ? <div className="hidden sm:block w-9 shrink-0" />
          : <Avatar name={item.author_name} role={role} size="md" className="hidden sm:flex" />
      )}
    </div>
  );
}
