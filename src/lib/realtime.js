// src/lib/realtime.js
//
// Lightweight client for the backend realtime gateway
// (apps/realtime). One websocket per page, multiplexed
// subscriptions across as many topics as the page needs.
//
// Resilience contract:
//   - On open       → subscribe to every topic
//   - On reconnect  → caller's onReconnect runs (single REST sync)
//   - On envelope   → caller's onEvent runs with a deduped envelope
//
// Dedupe is keyed by (entity_type, entity_id, occurred_at) so an
// echoed packet (e.g. local POST + push) doesn't double-apply on
// the page. Window is 5 seconds; long enough to swallow the round
// trip but short enough that a real retransmit on the next minute
// re-runs the reducer.

import { useEffect, useMemo, useRef } from "react";

function wsBase() {
  if (typeof window === "undefined") return null;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  return apiBase.replace(/^http/, "ws");
}

export function openRealtimeSocket({ auth = {}, onMessage, onOpen, onClose }) {
  const base = wsBase();
  if (!base) return null;
  const params = new URLSearchParams();
  if (auth.jwt) params.set("token", auth.jwt);
  if (auth.requestToken) params.set("request_token", auth.requestToken);
  if (auth.orderToken) params.set("order_token", auth.orderToken);
  if (auth.bookingToken) params.set("booking_token", auth.bookingToken);
  let ws;
  try {
    ws = new WebSocket(`${base}/ws/events/?${params.toString()}`);
  } catch {
    return null;
  }
  ws.onopen = () => onOpen?.(ws);
  ws.onclose = () => onClose?.();
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      onMessage?.(msg);
    } catch {}
  };
  return ws;
}

/**
 * useRealtime — subscribe to topics for the lifetime of the
 * component.
 *
 * Props:
 *   topics       — array of topic strings
 *   auth.jwt     — JWT access token (when available)
 *   auth.requestToken — custom-request guest session token
 *   auth.orderToken   — order-flow guest OTP token
 *   onEvent      — (envelope) => void
 *   onReconnect  — () => void, fired ONLY on reconnects (not the
 *                  initial connect). The page should run one REST
 *                  resync here so anything missed while offline is
 *                  picked up; realtime takes over again afterwards.
 *   onStatusChange — (status) => void where status is
 *                    "connecting" | "open" | "closed"
 */
export function useRealtime({
  topics,
  auth,
  onEvent,
  onReconnect,
  onStatusChange,
}) {
  // Memoize callbacks via refs so changing closure identities don't
  // tear down the socket.
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  const onStatusRef = useRef(onStatusChange);
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;
  onStatusRef.current = onStatusChange;

  // Stable serialisation of topics for the effect key.
  const topicsKey = useMemo(() => JSON.stringify(topics || []), [topics]);

  useEffect(() => {
    const parsedTopics = JSON.parse(topicsKey);
    if (!parsedTopics.length) return undefined;
    if (!auth || (!auth.jwt && !auth.requestToken && !auth.orderToken && !auth.bookingToken)) return undefined;

    let stopped = false;
    let backoff = 1000;
    let hadOpen = false;
    let ws;
    let reconnectTimer;
    const recentEnvelopes = new Map(); // dedupe cache

    function dedupeKey(env) {
      return [env.entity_type, env.entity_id, env.occurred_at].join("|");
    }

    function rememberEnvelope(env) {
      const key = dedupeKey(env);
      recentEnvelopes.set(key, Date.now());
      // Evict anything older than 5 s.
      const cutoff = Date.now() - 5000;
      for (const [k, t] of recentEnvelopes) {
        if (t < cutoff) recentEnvelopes.delete(k);
      }
      return key;
    }

    function isDuplicate(env) {
      const key = dedupeKey(env);
      const last = recentEnvelopes.get(key);
      return last && Date.now() - last < 5000;
    }

    function connect() {
      if (stopped) return;
      onStatusRef.current?.("connecting");
      ws = openRealtimeSocket({
        auth,
        onOpen: (sock) => {
          backoff = 1000;
          onStatusRef.current?.("open");
          for (const topic of parsedTopics) {
            try { sock.send(JSON.stringify({ action: "subscribe", topic })); } catch {}
          }
          if (hadOpen) {
            // This is a reconnect — give the page one chance to
            // resync via REST before realtime takes over again.
            try { onReconnectRef.current?.(); } catch {}
          }
          hadOpen = true;
        },
        onMessage: (env) => {
          if (!env?.entity_type) {
            // Subscription ACKs etc. — still expose them in case the
            // host wants to react.
            onEventRef.current?.(env);
            return;
          }
          if (isDuplicate(env)) return;
          rememberEnvelope(env);
          try { onEventRef.current?.(env); } catch {}
        },
        onClose: () => {
          if (stopped) return;
          onStatusRef.current?.("closed");
          reconnectTimer = setTimeout(connect, backoff);
          backoff = Math.min(backoff * 2, 15000);
        },
      });
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { ws?.close(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, auth?.jwt, auth?.requestToken, auth?.orderToken, auth?.bookingToken]);
}
