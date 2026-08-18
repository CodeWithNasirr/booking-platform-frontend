// src/hooks/useWebRTCSession.js
"use client";

/**
 * useWebRTCSession — native mesh WebRTC over the realtime signaling
 * relay. One RTCPeerConnection per remote peer; media flows peer↔peer
 * and never touches our servers (SFU-ready: swap the transport later
 * without changing this hook's surface).
 *
 * Design:
 *   * Signaling rides createSignalingChannel (session:<id> topic).
 *   * Peers are keyed by a client-generated id embedded in every
 *     signal, so glare resolution is symmetric without learning our
 *     server-side peer id.
 *   * Perfect negotiation (MDN pattern) per peer: politeness is the
 *     deterministic id comparison, so simultaneous offers resolve
 *     without deadlock.
 *   * Discovery: on join we broadcast `hello`; existing peers create a
 *     connection and offer; we answer. `bye` (or connection failure)
 *     tears a peer down.
 *
 * Inputs:
 *   sessionId    CollaborationSession id (required to activate)
 *   restAuth     collaborationApi auth descriptor (for the ICE fetch)
 *   wsAuth       openRealtimeSocket auth ({ jwt } | { orderToken } |
 *                { bookingToken } | { requestToken }) for signaling
 *   localStream  MediaStream from useMediaDevices (required to activate)
 *   iceServers   optional; if omitted we GET /ice-servers/
 *   active       gate — when false the mesh is torn down
 *
 * Returns:
 *   status        "idle"|"connecting"|"open"|"closed"
 *   remoteStreams [{ id, stream, connectionState }]
 *   peerCount     number of remote peers
 *   selfId        our client id
 *   replaceVideoTrack(track)  swap outgoing video on every peer
 *   getSenders()  flat list of RTCRtpSenders (advanced use)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createSignalingChannel } from "@/lib/webrtc/signaling";
import { getIceServers } from "@/lib/collaborationApi";

const DEFAULT_ICE = [{ urls: "stun:stun.l.google.com:19302" }];

export default function useWebRTCSession({
  sessionId,
  restAuth,
  wsAuth,
  localStream,
  iceServers,
  active = true,
}) {
  const [status, setStatus] = useState("idle");
  const [remoteMap, setRemoteMap] = useState({}); // id → { stream, connectionState }
  const [selfId, setSelfId] = useState(null);

  // Imperative state kept in refs so the signaling handlers don't churn
  // on every React render.
  const peersRef = useRef(new Map()); // id → peer record
  const signalingRef = useRef(null);
  const iceRef = useRef(iceServers && iceServers.length ? iceServers : null);
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  // ── remote stream bookkeeping (drives re-render) ──
  const publishRemote = useCallback((id, patch) => {
    setRemoteMap((prev) => {
      const existing = prev[id] || {};
      return { ...prev, [id]: { ...existing, ...patch } };
    });
  }, []);

  const dropRemote = useCallback((id) => {
    setRemoteMap((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // ── peer lifecycle ──
  const destroyPeer = useCallback(
    (id) => {
      const peer = peersRef.current.get(id);
      if (peer) {
        try {
          peer.pc.ontrack = null;
          peer.pc.onicecandidate = null;
          peer.pc.onnegotiationneeded = null;
          peer.pc.onconnectionstatechange = null;
          peer.pc.close();
        } catch {}
        peersRef.current.delete(id);
      }
      dropRemote(id);
    },
    [dropRemote]
  );

  const ensurePeer = useCallback(
    (remoteId) => {
      let peer = peersRef.current.get(remoteId);
      if (peer) return peer;

      const pc = new RTCPeerConnection({
        iceServers: iceRef.current || DEFAULT_ICE,
      });
      const self = signalingRef.current?.selfId;
      // Deterministic, symmetric politeness. The "polite" peer yields
      // on an offer collision; the "impolite" one ignores the incoming
      // offer. Any consistent rule works as long as both sides agree.
      const polite = String(self) < String(remoteId);

      peer = { pc, polite, makingOffer: false, ignoreOffer: false };
      peersRef.current.set(remoteId, peer);

      // Publish our local tracks to this peer.
      const ls = localStreamRef.current;
      if (ls) {
        ls.getTracks().forEach((t) => {
          try {
            pc.addTrack(t, ls);
          } catch {}
        });
      }

      pc.onnegotiationneeded = async () => {
        try {
          peer.makingOffer = true;
          await pc.setLocalDescription();
          signalingRef.current?.send(
            "sdp",
            { description: pc.localDescription },
            remoteId
          );
        } catch {
          // swallow — perfect negotiation tolerates dropped attempts
        } finally {
          peer.makingOffer = false;
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          signalingRef.current?.send("ice", { candidate }, remoteId);
        }
      };

      pc.ontrack = (ev) => {
        const stream = ev.streams && ev.streams[0];
        if (stream) publishRemote(remoteId, { stream });
      };

      pc.onconnectionstatechange = () => {
        const cs = pc.connectionState;
        publishRemote(remoteId, { connectionState: cs });
        if (cs === "failed" || cs === "closed") {
          // Let ICE try to recover on "disconnected"; only reap on hard
          // failure/close.
          if (cs === "failed") {
            try {
              pc.restartIce && pc.restartIce();
            } catch {}
          }
        }
      };

      publishRemote(remoteId, { connectionState: pc.connectionState });
      return peer;
    },
    [publishRemote]
  );

  // ── incoming signal handler (perfect negotiation) ──
  const handleSignal = useCallback(
    async ({ signal, from, data }) => {
      if (signal === "hello") {
        // A peer announced itself — open a connection and let
        // negotiationneeded drive the offer.
        ensurePeer(from);
        return;
      }
      if (signal === "bye") {
        destroyPeer(from);
        return;
      }

      const peer = ensurePeer(from);
      const pc = peer.pc;

      try {
        if (signal === "sdp") {
          const description = data.description;
          if (!description) return;
          const offerCollision =
            description.type === "offer" &&
            (peer.makingOffer || pc.signalingState !== "stable");

          peer.ignoreOffer = !peer.polite && offerCollision;
          if (peer.ignoreOffer) return;

          await pc.setRemoteDescription(description);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            signalingRef.current?.send(
              "sdp",
              { description: pc.localDescription },
              from
            );
          }
        } else if (signal === "ice") {
          if (!data.candidate) return;
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            if (!peer.ignoreOffer) throw err;
          }
        }
      } catch {
        // Non-fatal: a dropped candidate/offer during renegotiation is
        // recoverable; ICE will retry.
      }
    },
    [ensurePeer, destroyPeer]
  );

  // ── swap outgoing video (camera switch / screen share) ──
  const replaceVideoTrack = useCallback((track) => {
    peersRef.current.forEach((peer) => {
      const sender = peer.pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        try {
          sender.replaceTrack(track);
        } catch {}
      }
    });
  }, []);

  const getSenders = useCallback(() => {
    const out = [];
    peersRef.current.forEach((peer) => {
      out.push(...peer.pc.getSenders());
    });
    return out;
  }, []);

  // ── activation lifecycle ──
  useEffect(() => {
    if (!active || !sessionId || !localStream) {
      return undefined;
    }
    let cancelled = false;
    // Stable Map instance — safe to reference in cleanup.
    const peers = peersRef.current;

    async function boot() {
      // Ensure ICE servers before creating any peer.
      if (!iceRef.current) {
        try {
          const res = await getIceServers(restAuth);
          if (!cancelled && res && res.ice_servers) {
            iceRef.current = res.ice_servers;
          }
        } catch {
          // Fall back to public STUN — audio/video still works on open
          // networks; TURN-only clients will fail to connect.
        }
        if (!iceRef.current) iceRef.current = DEFAULT_ICE;
      }
      if (cancelled) return;

      setStatus("connecting");
      const channel = createSignalingChannel({
        sessionId,
        auth: wsAuth,
        onSignal: handleSignal,
        onStatus: (s) => {
          if (cancelled) return;
          setStatus(s === "open" ? "open" : s);
        },
        onReady: () => {
          // Announce ourselves so existing peers connect to us.
          channel.send("hello");
        },
      });
      signalingRef.current = channel;
      setSelfId(channel.selfId);
    }

    boot();

    return () => {
      cancelled = true;
      try {
        signalingRef.current?.close();
      } catch {}
      signalingRef.current = null;
      peers.forEach((_, id) => destroyPeer(id));
      peers.clear();
      setRemoteMap({});
      setStatus("closed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sessionId, localStream]);

  const remoteStreams = Object.entries(remoteMap).map(([id, v]) => ({
    id,
    stream: v.stream || null,
    connectionState: v.connectionState || "new",
  }));

  return {
    status,
    remoteStreams,
    peerCount: remoteStreams.length,
    selfId,
    replaceVideoTrack,
    getSenders,
  };
}
