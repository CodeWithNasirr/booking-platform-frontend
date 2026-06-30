"use client";

/**
 * ConversationBubble — one chat row in the request feed.
 *
 * Alignment rules (consistent across customer / CRM / provider):
 *   customer → right
 *   provider → left
 *   admin    → centered
 *   info_request → amber, alignment by author role
 */

import { useMemo } from "react";

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium", timeStyle: "short",
  });
}

export default function ConversationBubble({ item, viewer = "customer" }) {
  const role = item.author_role;
  const isCustomer = role === "customer";
  const isAdmin = role === "admin";
  const isProvider = role === "provider";
  const isInfo = item.msg_kind === "info_request";

  const { align, bg } = useMemo(() => {
    // From the customer's perspective: their messages right.
    // From the provider's perspective: provider messages right.
    // Admin always centers regardless of viewer.
    const isViewerMessage =
      (viewer === "customer" && isCustomer) ||
      (viewer === "provider" && isProvider);

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
        ? "bg-blue-50 border-blue-100"
        : isProvider
          ? "bg-emerald-50 border-emerald-100"
          : "bg-white border-gray-200",
    };
  }, [viewer, isCustomer, isProvider, isAdmin, isInfo]);

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-2xl border ${bg} px-4 py-2.5 shadow-sm`}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
            {item.author_name}
            {isInfo && (
              <span className="ml-1 text-amber-700 normal-case">· needs info</span>
            )}
          </span>
          <span className="text-[10px] text-gray-400">{formatTime(item.at)}</span>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-line">{item.body}</p>
      </div>
    </div>
  );
}
