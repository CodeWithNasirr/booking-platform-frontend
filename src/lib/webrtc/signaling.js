// src/lib/webrtc/signaling.js
//
// WebRTC signaling channel — a thin wrapper around the realtime
// gateway (apps/realtime EventsConsumer) dedicated to one call.
//
// Why a dedicated socket per call (not the page's shared chat socket):
//   * the backend stamps a stable per-CONNECTION peer id and relays
//     `signal` frames only between subscribers of a `session:<id>`
//     topic, never echoing to the sender;
//   * keeping the call on its own connection isolates its lifetime
//     (open on join, close on hangup) from the page's chat feed and
//     keeps reconnect/backoff independent.
//
// Wire contract (see apps/realtime/consumers.py):
//   client → server : { action:"signal", topic, signal, payload }
//   server → client : { event:"webrtc.signal", signal, peer_id, payload }
//
// We do NOT rely on the server's peer_id for addressing. Instead every
// payload embeds our own client-generated { from, to } ids, so glare
// resolution (perfect negotiation) has a symmetric, deterministic key
// without a round-trip to learn our server-side id. Signals are
// broadcast to the topic group; receivers filter by `to`.

import { openRealtimeSocket } from "@/lib/realtime";
import { session as sessionTopic } from "@/lib/webrtc/topics";

function randomId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch {}
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * createSignalingChannel — connect to a session's signaling topic.
 *
 * Options:
 *   sessionId  — CollaborationSession id
 *   auth       — { jwt } | { orderToken } | { requestToken } (same
 *                shape openRealtimeSocket accepts)
 *   selfId     — optional stable client id; generated if omitted
 *   onSignal   — ({ signal, from, to, data }) => void   (peer signals)
 *   onStatus   — ("connecting"|"open"|"closed") => void
 *   onReady    — () => void   fires once the topic subscription is ACKed
 *
 * Returns { selfId, send, close, isOpen }.
 */
export function createSignalingChannel({
  sessionId,
  auth,
  selfId = randomId(),
  onSignal,
  onStatus,
  onReady,
}) {
  const topic = sessionTopic(sessionId);
  let stopped = false;
  let backoff = 1000;
  let ws = null;
  let reconnectTimer = null;
  let subscribed = false;

  function connect() {
    if (stopped) return;
    onStatus?.("connecting");
    ws = openRealtimeSocket({
      auth,
      onOpen: (sock) => {
        backoff = 1000;
        try {
          sock.send(JSON.stringify({ action: "subscribe", topic }));
        } catch {}
      },
      onMessage: (msg) => {
        if (!msg) return;
        // Subscription ACK — signaling is safe to send now.
        if (msg.subscribed === topic) {
          subscribed = true;
          onStatus?.("open");
          onReady?.();
          return;
        }
        if (msg.error) {
          // e.g. forbidden / not subscribed — surface as closed so the
          // host tears the call down rather than hanging.
          if (msg.topic === topic || msg.error === "forbidden") {
            onStatus?.("closed");
          }
          return;
        }
        if (msg.event === "webrtc.signal") {
          const payload = msg.payload || {};
          const { from, to } = payload;
          if (!from || from === selfId) return; // never process our own
          if (to && to !== selfId) return; // addressed to another peer
          const { from: _f, to: _t, ...data } = payload;
          onSignal?.({ signal: msg.signal, from, to, data });
        }
      },
      onClose: () => {
        subscribed = false;
        if (stopped) return;
        onStatus?.("closed");
        reconnectTimer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 15000);
      },
    });
  }

  connect();

  /**
   * send — relay a signal to peers on the topic.
   *   signalType : "hello" | "sdp" | "ice" | "bye"
   *   data       : signal-specific body (merged with { from, to })
   *   toId       : target client id, or null/undefined to broadcast
   */
  function send(signalType, data = {}, toId = null) {
    if (!ws || ws.readyState !== 1 || !subscribed) return false;
    try {
      ws.send(
        JSON.stringify({
          action: "signal",
          topic,
          signal: signalType,
          payload: { from: selfId, to: toId || null, ...data },
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  function close() {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    // Best-effort farewell so peers tear down promptly.
    try {
      send("bye");
    } catch {}
    try {
      ws?.close();
    } catch {}
  }

  return {
    selfId,
    send,
    close,
    isOpen: () => !!ws && ws.readyState === 1 && subscribed,
  };
}
