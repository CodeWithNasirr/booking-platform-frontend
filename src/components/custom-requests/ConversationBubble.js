"use client";

/**
 * ConversationBubble — one chat row in the request feed.
 *
 * V3.E polish:
 *   - Avatar circle (initials) on the side opposite the bubble.
 *   - When `grouped` is true (consecutive message from the same
 *     author), the header (author + timestamp) is suppressed
 *     and the avatar is hidden, so a thread of replies reads
 *     like a single chat group rather than N stamped cards.
 *
 * Alignment is viewer-relative:
 *   viewer="customer" — customer messages right
 *   viewer="provider" — provider messages right
 *   admin always centers regardless of viewer
 */

import { useMemo } from "react";

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium", timeStyle: "short",
  });
}

function initialsFor(name) {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "·";
}

function avatarTone(role) {
  switch (role) {
    case "customer": return "bg-blue-100 text-blue-700";
    case "provider": return "bg-emerald-100 text-emerald-700";
    case "admin":    return "bg-gray-200 text-gray-700";
    default:         return "bg-amber-100 text-amber-700";
  }
}

export default function ConversationBubble({ item, viewer = "customer", grouped = false }) {
  const role = item.author_role;
  const isCustomer = role === "customer";
  const isAdmin = role === "admin";
  const isProvider = role === "provider";
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
        ? "bg-blue-50 border-blue-100"
        : isProvider
          ? "bg-emerald-50 border-emerald-100"
          : "bg-white border-gray-200",
    };
  }, [isViewerMessage, isProvider, isAdmin, isInfo]);

  const initials = initialsFor(item.author_name);
  const avatarBg = avatarTone(role);

  // Avatar sits on the opposite side of the bubble (customer
  // bubble right → avatar left edge of the row; provider bubble
  // left → avatar right of the bubble, etc).
  const avatarEl = (
    <div
      aria-hidden="true"
      className={`hidden sm:flex shrink-0 w-8 h-8 rounded-full items-center justify-center text-[10px] font-bold ${avatarBg}`}
    >
      {initials}
    </div>
  );

  return (
    <div className={`flex items-end gap-2 ${align} ${grouped ? "mt-0.5" : "mt-2"}`}>
      {!isViewerMessage && !isAdmin && !grouped && avatarEl}
      {!isViewerMessage && !isAdmin && grouped && (
        <div className="hidden sm:block w-8 shrink-0" />
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

      {isViewerMessage && !grouped && avatarEl}
      {isViewerMessage && grouped && (
        <div className="hidden sm:block w-8 shrink-0" />
      )}
    </div>
  );
}
