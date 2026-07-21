"use client";

/**
 * BookingConversationPanel
 *
 * The single booking conversation surface shared by the customer,
 * provider, and tenant views. Wraps the shared OrderConversation
 * (ConversationFeed + StickyComposer + UploadQueueTray) against the
 * booking messages / timeline / upload_file endpoints, and patches the
 * feed live from the booking:<id> realtime topic.
 *
 * Auth is dual-mode:
 *   auth={{ jwt }}         → member (provider / tenant admin). Sent as
 *                            Authorization: Bearer.
 *   auth={{ guestToken }}  → customer guest session. Sent as
 *                            X-Booking-Token, because the BookingViewSet's
 *                            SimpleJWT authenticator would reject a guest
 *                            token in Authorization (401) before AllowAny.
 */

import { useState, useEffect, useCallback } from "react";
import { OrderConversation } from "@/components/orders";
import { useRealtime } from "@/lib/realtime";
import { uploadWithProgress } from "@/lib/uploadWithProgress";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function buildHeaders(domain, auth, { json = true } = {}) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (domain) h["X-Tenant"] = domain;
  if (auth?.jwt) {
    h["Authorization"] = auth.jwt.startsWith("Bearer ") ? auth.jwt : `Bearer ${auth.jwt}`;
  } else if (auth?.guestToken) {
    h["X-Booking-Token"] = auth.guestToken.replace(/^Bearer /, "");
  }
  return h;
}

// Append a booking:<id> envelope into the {messages, timeline_events}
// shape OrderConversation consumes.
function applyBookingEnvelope(convo, env) {
  const base = convo || { messages: [], timeline_events: [] };
  const row = env?.payload;
  if (!row?.id) return base;
  if (env.entity_type === "booking.message") {
    if (base.messages.some((m) => m.id === row.id)) return base;
    return { ...base, messages: [...base.messages, row] };
  }
  if (env.entity_type === "booking.timeline_event") {
    if (base.timeline_events.some((e) => e.id === row.id)) return base;
    return { ...base, timeline_events: [...base.timeline_events, row] };
  }
  return base;
}

export default function BookingConversationPanel({
  bookingId,
  domain = "",
  auth,
  viewer = "admin",
  showComposer = true,
  className = "",
}) {
  const [conversation, setConversation] = useState(null);

  const fetchConversation = useCallback(async () => {
    if (!bookingId) return;
    try {
      const headers = buildHeaders(domain, auth);
      const [mRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/bookings/${bookingId}/messages/`, { headers, credentials: "include" }),
        fetch(`${API_BASE}/api/v1/bookings/${bookingId}/timeline/`, { headers, credentials: "include" }),
      ]);
      const messages = mRes.ok ? await mRes.json() : [];
      const timeline_events = tRes.ok ? await tRes.json() : [];
      setConversation({
        messages: Array.isArray(messages) ? messages : [],
        timeline_events: Array.isArray(timeline_events) ? timeline_events : [],
      });
    } catch (e) {
      console.error("[BookingConversation] load failed:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, domain, auth?.jwt, auth?.guestToken]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useRealtime({
    topics: bookingId ? [`booking:${bookingId}`] : [],
    auth: { jwt: auth?.jwt || null, bookingToken: auth?.guestToken || null },
    onEvent: (env) => setConversation((prev) => applyBookingEnvelope(prev, env)),
    onReconnect: () => fetchConversation(),
  });

  return (
    <OrderConversation
      order={conversation || { messages: [], timeline_events: [] }}
      viewer={viewer}
      className={className}
      showComposer={showComposer}
      onSendMessage={async (content) => {
        const res = await fetch(
          `${API_BASE}/api/v1/bookings/${bookingId}/messages/`,
          {
            method: "POST",
            headers: buildHeaders(domain, auth),
            credentials: "include",
            body: JSON.stringify({ content }),
          }
        );
        if (!res.ok) throw new Error("Failed to send message");
        fetchConversation();
      }}
      onUploadFile={async (file, { onProgress, signal }) => {
        const form = new FormData();
        form.append("file", file);
        form.append("category", "reference");
        await uploadWithProgress(
          `${API_BASE}/api/v1/bookings/${bookingId}/upload_file/`,
          form,
          { headers: buildHeaders(domain, auth, { json: false }), onProgress, signal }
        );
        fetchConversation();
      }}
    />
  );
}
