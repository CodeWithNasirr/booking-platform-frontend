// src/lib/realtime.js
//
// Lightweight client for the backend realtime gateway
// (apps/realtime). One websocket per page, multiplexed subscriptions
// across as many topics as the page needs.
//
// Wire format (server → client):
//   { topic: "...", event: "...", payload: { ... } }
//
// Usage:
//   import { useRealtime } from "@/lib/realtime";
//
//   useRealtime({
//     topics: ["custom_request:abc"],
//     auth: { jwt: "...", requestToken: "..." },
//     onEvent: (msg) => refetchSomething(),
//   });

import { useEffect, useRef } from "react";

function wsBase() {
  if (typeof window === "undefined") return null;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  // http(s):// → ws(s)://
  return apiBase.replace(/^http/, "ws");
}

export function openRealtimeSocket({ auth = {}, onMessage, onOpen, onClose }) {
  const base = wsBase();
  if (!base) return null;

  const params = new URLSearchParams();
  if (auth.jwt) params.set("token", auth.jwt);
  if (auth.requestToken) params.set("request_token", auth.requestToken);

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
 * component. Reconnect on disconnect with linear backoff.
 *
 * Props:
 *   topics       — array of topic strings (e.g. ["custom_request:<id>"])
 *   auth.jwt     — JWT access token (when available)
 *   auth.requestToken — guest request session token (when present)
 *   onEvent      — (msg) => void, called for every broadcast
 */
export function useRealtime({ topics, auth, onEvent }) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!topics || topics.length === 0) return undefined;
    if (!auth || (!auth.jwt && !auth.requestToken)) return undefined;

    let stopped = false;
    let backoff = 1000;
    let ws;
    let reconnectTimer;

    function connect() {
      if (stopped) return;
      ws = openRealtimeSocket({
        auth,
        onOpen: (sock) => {
          backoff = 1000;
          for (const topic of topics) {
            try {
              sock.send(JSON.stringify({ action: "subscribe", topic }));
            } catch {}
          }
        },
        onMessage: (msg) => handlerRef.current?.(msg),
        onClose: () => {
          if (stopped) return;
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
    // topic list and auth tokens form the effective key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(topics), auth?.jwt, auth?.requestToken]);
}
