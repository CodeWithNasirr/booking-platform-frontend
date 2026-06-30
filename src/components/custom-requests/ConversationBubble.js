"use client";

/**
 * ConversationBubble — one chat row.
 *
 * Composed onto the design-system Avatar primitive so the
 * conversation feed shares its avatar language with every
 * other list / detail surface across the platform.
 *
 * Grouping: when `grouped=true`, the second-and-later messages
 * from the same author within the grouping window hide the
 * header (name + timestamp) and the avatar slot becomes a
 * spacer. The thread reads like Intercom / iMessage.
 */

import { useMemo } from "react";
import { Avatar } from "@/components/ui";

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium", timeStyle: "short",
  });
}

export default function ConversationBubble({ item, viewer = "customer", grouped = false }) {
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

  return (
    <div className={`flex items-end gap-2 ${align} ${grouped ? "mt-0.5" : "mt-2"}`}>
      {!isViewerMessage && !isAdmin && (
        grouped
          ? <div className="hidden sm:block w-9 shrink-0" />
          : <Avatar name={item.author_name} role={role} size="md" className="hidden sm:flex" />
      )}

      <div className={`max-w-[80%] rounded-2xl border ${bg} px-4 py-2 shadow-sm`}>
        {!grouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
              {item.author_name}
              {isInfo && (
                <span className="ml-1 text-amber-700 normal-case">· needs info</span>
              )}
            </span>
            <span className="text-[10px] text-gray-400">{formatTime(item.at)}</span>
          </div>
        )}
        <p className="text-sm text-gray-800 whitespace-pre-line">{item.body}</p>
      </div>

      {isViewerMessage && (
        grouped
          ? <div className="hidden sm:block w-9 shrink-0" />
          : <Avatar name={item.author_name} role={role} size="md" className="hidden sm:flex" />
      )}
    </div>
  );
}
