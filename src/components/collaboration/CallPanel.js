"use client";

/**
 * CallPanel — the smart, self-contained in-call surface. Mounting it
 * means "I am in this call": it acquires local media, joins the mesh,
 * and tears everything down on unmount / hang-up.
 *
 * It owns the imperative glue between the three Phase-4 primitives:
 *   useMediaDevices   — local mic/camera stream + mute/switch
 *   useWebRTCSession  — the peer mesh + replaceVideoTrack seam
 *   collaborationApi  — REST lifecycle (join / leave / screen-share)
 *
 * Screen share uses getDisplayMedia + replaceVideoTrack (no
 * renegotiation) and restores the camera track on stop; the browser's
 * own "Stop sharing" button is handled via track.onended.
 *
 * Presentation is delegated to CallStage + CallControlBar; this file
 * is deliberately layout-light so a page can drop it into a modal, a
 * drawer, or a docked panel.
 *
 * Props:
 *   session      serialized CollaborationSession (must be live)
 *   restAuth     collaborationApi auth descriptor ({ tenantId, jwt } or
 *                { tenantId, guestToken, guestHeader })
 *   wsAuth       openRealtimeSocket auth ({ jwt } | { orderToken } |
 *                { bookingToken }) for signaling
 *   selfName     label for the local tile
 *   joinOnMount  call join() on mount (default true)
 *   onClose      () => void  — fired after we leave / on fatal error
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

import useMediaDevices from "@/hooks/useMediaDevices";
import useWebRTCSession from "@/hooks/useWebRTCSession";
import { joinSession, leaveSession, setScreenShare } from "@/lib/collaborationApi";
import CallStage from "./CallStage";
import CallControlBar from "./CallControlBar";

function canScreenShare() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  );
}

export default function CallPanel({
  session,
  restAuth,
  wsAuth,
  selfName = "You",
  joinOnMount = true,
  onClose,
}) {
  const audioOnly = session?.media_type === "audio";

  const media = useMediaDevices();
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState(null);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [busy, setBusy] = useState(false);

  const screenStreamRef = useRef(null);
  const leftRef = useRef(false);

  const webrtc = useWebRTCSession({
    sessionId: session?.id,
    restAuth,
    wsAuth,
    localStream: media.stream,
    iceServers: session?.ice_servers, // present when caller passed the start/join response
    active: ready && !fatal,
  });

  // ── acquire local media + (optionally) join over REST ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await media.start({ audio: true, video: !audioOnly });
        if (cancelled) return;
        if (joinOnMount && session?.id) {
          try {
            await joinSession(restAuth, session.id);
          } catch {
            // Non-fatal: the caller may have already registered us as a
            // participant (e.g. the initiator). Signaling still proceeds.
          }
        }
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) setFatal(e?.message || "Could not access your microphone or camera.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // ── stop screen share, restoring the camera track ──
  const stopScreenShare = useCallback(
    (notify = true) => {
      const s = screenStreamRef.current;
      if (s) {
        try {
          s.getTracks().forEach((t) => t.stop());
        } catch {}
        screenStreamRef.current = null;
      }
      const camTrack = media.stream?.getVideoTracks()[0] || null;
      webrtc.replaceVideoTrack(camTrack);
      setSharingScreen(false);
      if (notify && session?.id) {
        setScreenShare(restAuth, session.id, false).catch(() => {});
      }
    },
    [media.stream, webrtc, session?.id, restAuth]
  );

  const toggleScreenShare = useCallback(async () => {
    if (busy) return;
    if (sharingScreen) {
      stopScreenShare(true);
      return;
    }
    if (!canScreenShare()) return;
    setBusy(true);
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const track = display.getVideoTracks()[0];
      if (!track) return;
      screenStreamRef.current = display;
      // The browser chrome exposes its own "Stop sharing" control.
      track.onended = () => stopScreenShare(true);
      webrtc.replaceVideoTrack(track);
      setSharingScreen(true);
      if (session?.id) setScreenShare(restAuth, session.id, true).catch(() => {});
    } catch {
      // user cancelled the picker — no-op
    } finally {
      setBusy(false);
    }
  }, [busy, sharingScreen, stopScreenShare, webrtc, session?.id, restAuth]);

  const switchCamera = useCallback(async () => {
    try {
      const track = await media.switchCamera();
      if (track && !sharingScreen) webrtc.replaceVideoTrack(track);
    } catch {}
  }, [media, webrtc, sharingScreen]);

  // ── hang up: leave over REST, stop everything, notify host ──
  const hangUp = useCallback(async () => {
    if (leftRef.current) return;
    leftRef.current = true;
    try {
      if (screenStreamRef.current) stopScreenShare(false);
    } catch {}
    try {
      media.stop();
    } catch {}
    try {
      if (session?.id) await leaveSession(restAuth, session.id);
    } catch {}
    onClose?.();
  }, [media, session?.id, restAuth, stopScreenShare, onClose]);

  // Leave when the TAB/WINDOW actually goes away — never on a React
  // unmount. Calling leaveSession() in an effect *cleanup* was a bug: React
  // StrictMode double-invokes effects (mount → cleanup → mount) in dev, so
  // the cleanup fired leaveSession immediately after start; the backend
  // then auto-ended the session (last participant left) and the modal
  // vanished. A call must only end on Hang Up, tab close, expiry, or a
  // backend end — so we bind the leave to `pagehide` (fires on real
  // navigation/close) with a keepalive fetch that survives unload.
  useEffect(() => {
    if (!session?.id) return undefined;
    const onPageHide = () => {
      if (leftRef.current) return;
      leftRef.current = true;
      try {
        leaveSession(restAuth, session.id, { keepalive: true }).catch(() => {});
      } catch {}
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [session?.id, restAuth]);

  // ── render ──
  if (fatal) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-white">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-sm font-medium">{fatal}</p>
        <p className="text-xs text-white/60">
          Check your browser permissions for camera and microphone, then try again.
        </p>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="mt-2 h-9 px-4 rounded-lg text-sm font-medium bg-white/15 text-white hover:bg-white/25"
        >
          Close
        </button>
      </div>
    );
  }

  const localPreviewStream = sharingScreen
    ? screenStreamRef.current
    : media.stream;

  const remotes = webrtc.remoteStreams.map((r) => ({
    id: r.id,
    stream: r.stream,
    connectionState: r.connectionState,
    label: "Participant",
  }));

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-950 rounded-2xl overflow-hidden">
      <div className="flex-1 min-h-0 p-3">
        {media.starting && !media.stream ? (
          <div className="flex items-center justify-center h-full text-white/70 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Starting your camera…
          </div>
        ) : (
          <CallStage
            localStream={localPreviewStream}
            localLabel={selfName}
            audioEnabled={media.audioEnabled}
            videoEnabled={media.videoEnabled}
            sharingScreen={sharingScreen}
            remotes={remotes}
            audioOnly={audioOnly}
          />
        )}
      </div>

      <div className="border-t border-white/10">
        <CallControlBar
          audioEnabled={media.audioEnabled}
          videoEnabled={media.videoEnabled}
          sharingScreen={sharingScreen}
          audioOnly={audioOnly}
          canScreenShare={canScreenShare()}
          canSwitchCamera={media.cameras.length > 1}
          busy={busy}
          onToggleAudio={() => media.toggleAudio()}
          onToggleVideo={() => media.toggleVideo()}
          onToggleScreenShare={toggleScreenShare}
          onSwitchCamera={switchCamera}
          onHangUp={hangUp}
        />
      </div>
    </div>
  );
}
