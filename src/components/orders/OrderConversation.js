"use client";

/**
 * OrderConversation
 *
 * Order-side twin of the custom-requests conversation view. Bridges
 * the OrderMessage / OrderTimelineEvent payload shape into the
 * existing ConversationFeed / StickyComposer / UploadQueueTray
 * primitives so all three surfaces (customer, tenant CRM, provider)
 * render an identical, brand-aware thread.
 *
 * Props:
 *   order              — the current Order object (messages +
 *                        timeline_events must be present)
 *   viewer             — "customer" | "admin" | "provider"
 *   onSendMessage      — async (content) => msg  (host posts the
 *                        message; realtime appends the persisted row)
 *   onUploadFile       — async (file, { onProgress, signal }) => any
 *                        wired to useUploadQueue
 *   locked             — disables composer + shows locked message
 *   lockedMessage      — copy for the locked state
 *   showComposer       — false for terminal orders (completed, etc.)
 *   composerSticky     — pin the composer to the viewport bottom
 *                        (customer portal) vs the column (CRM/provider)
 *   className          — layout overrides for the host container
 */

import { useCallback, useMemo, useState } from "react";
import ConversationFeed from "@/components/custom-requests/ConversationFeed";
import StickyComposer from "@/components/custom-requests/StickyComposer";
import UploadQueueTray from "@/components/custom-requests/UploadQueueTray";
import useUploadQueue from "@/components/custom-requests/useUploadQueue";

// Map an OrderMessage row → the shape ConversationFeed's buildFeed
// expects for `request.messages[]`.
function messageToRequestShape(m) {
  const role = m.is_system_message ? "admin" : (m.sender_type || "customer");
  return {
    id: m.id,
    body: m.content,
    kind: m.is_system_message ? "system" : "message",
    author_role: role,
    author_name: m.sender_name || (m.is_system_message ? "System" : "User"),
    created_at: m.created_at,
    updated_at: m.updated_at || m.created_at,
  };
}

// Map an OrderTimelineEvent row → the shape ConversationFeed's
// buildFeed expects for `request.timeline[]`. buildFeed already
// skips events whose label is null (message_posted, info_requested),
// so we forward the same event names our timeline uses. Event names
// unknown to the custom-request table just render with the raw
// event key as the label — good enough while we align copy.
function timelineToRequestShape(evt) {
  return {
    id: evt.id,
    event: evt.event,
    actor_role: evt.actor_role,
    metadata: evt.metadata || {},
    // Forward the attachment so file_uploaded events render the actual file.
    attachment: evt.attachment || null,
    created_at: evt.created_at,
  };
}

function toRequestLike(order) {
  return {
    messages: (order?.messages || []).map(messageToRequestShape),
    timeline: (order?.timeline_events || []).map(timelineToRequestShape),
  };
}

export default function OrderConversation({
  order,
  viewer = "customer",
  onSendMessage,
  onUploadFile,
  locked = false,
  lockedMessage = "This order is locked.",
  showComposer = true,
  composerSticky = false,
  fill = false,
  className = "",
}) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);

  // The upload queue is host-provided via onUploadFile. If the host
  // doesn't wire uploads, the composer's paperclip button is hidden.
  const uploadFn = useCallback(
    async (file, ctx) => {
      if (!onUploadFile) throw new Error("No upload handler wired");
      await onUploadFile(file, ctx);
    },
    [onUploadFile],
  );
  const queue = useUploadQueue({ upload: uploadFn });

  const requestLike = useMemo(() => toRequestLike(order), [order]);

  // Drop any pending optimistic message the moment the backend echo
  // shows up in `order.messages` (matched by body + author_role).
  const reconciledPending = useMemo(() => {
    if (!pendingMessages.length) return pendingMessages;
    const sent = new Set(
      (order?.messages || []).map((m) => `${m.sender_type}|${(m.content || "").trim()}`),
    );
    return pendingMessages.filter((p) => !sent.has(`${p.author_role}|${(p.body || "").trim()}`));
  }, [pendingMessages, order?.messages]);

  const handleSend = useCallback(async () => {
    const body = messageText.trim();
    if (!body || sending) return;

    const optimistic = {
      id: `pending-${Date.now()}`,
      at: new Date().toISOString(),
      author_role: viewer === "admin" ? "admin" : viewer === "provider" ? "provider" : "customer",
      author_name: "You",
      body,
    };
    setPendingMessages((prev) => [...prev, optimistic]);
    setMessageText("");
    setSending(true);
    try {
      await onSendMessage?.(body);
      // Reconciliation happens automatically via realtime → order.messages
      // replacing the optimistic row through the reconciledPending filter.
    } catch (e) {
      // Roll the optimistic bubble back so the composer can retry.
      setPendingMessages((prev) => prev.filter((p) => p.id !== optimistic.id));
      setMessageText(body);
    } finally {
      setSending(false);
    }
  }, [messageText, sending, onSendMessage, viewer]);

  return (
    <div className={`flex flex-col ${fill ? "h-full min-h-0" : ""} ${className}`}>
      {/* When `fill`, ConversationFeed owns a bounded, independently
          scrolling container and the composer stays pinned below it
          (CRM/portal chat). Otherwise the panel grows with content and
          the page scrolls (default, unchanged for existing callers). */}
      {fill ? (
        <ConversationFeed
          request={requestLike}
          viewer={viewer}
          pendingMessages={reconciledPending}
          fill
        />
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ConversationFeed
            request={requestLike}
            viewer={viewer}
            pendingMessages={reconciledPending}
          />
        </div>
      )}

      {queue.queue.length > 0 && (
        <div className="mt-3">
          <UploadQueueTray
            queue={queue.queue}
            onCancel={queue.cancel}
            onRetry={queue.retry}
            onDismiss={queue.dismiss}
            onClearDone={queue.clearDone}
          />
        </div>
      )}

      {showComposer && (
        <StickyComposer
          value={messageText}
          onChange={setMessageText}
          onSend={handleSend}
          onAttach={onUploadFile ? queue.enqueue : undefined}
          sending={sending}
          uploading={queue.busy}
          disabled={locked}
          locked={locked}
          lockedMessage={lockedMessage}
          sticky={composerSticky}
        />
      )}
    </div>
  );
}
