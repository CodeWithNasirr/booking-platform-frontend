// src/hooks/useMediaDevices.js
"use client";

/**
 * useMediaDevices — own the local camera/mic MediaStream for a call.
 *
 * Responsibilities (transport-agnostic; the mesh hook consumes this):
 *   * acquire a getUserMedia stream on demand (audio and/or video),
 *   * mute/unmute audio and pause/resume video without renegotiating
 *     (we toggle track.enabled, keeping the sender in place),
 *   * enumerate cameras + switch between them (front/back on mobile),
 *   * clean shutdown that stops every track.
 *
 * It deliberately does NOT touch RTCPeerConnection — useWebRTCSession
 * wires this stream into the mesh and handles renegotiation when the
 * video track is *replaced* (camera switch, screen share).
 *
 * Returns:
 *   stream          MediaStream | null
 *   error           DOMException | null (getUserMedia failure)
 *   starting        bool
 *   audioEnabled    bool
 *   videoEnabled    bool
 *   cameras         MediaDeviceInfo[] (videoinput)
 *   currentCameraId string | null
 *   start({ audio, video })   → MediaStream
 *   stop()
 *   toggleAudio(on?)  → bool
 *   toggleVideo(on?)  → bool
 *   switchCamera(deviceId?)  → MediaStream (rotates if no id given)
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * callCapability — why a call can or can't run, with a reason so the UI
 * never shows "unsupported" to a browser that actually supports WebRTC.
 *
 * The trap: `navigator.mediaDevices` is undefined in TWO cases unrelated
 * to browser support —
 *   1. server-side render (no `navigator`), and
 *   2. an INSECURE CONTEXT. Browsers only expose getUserMedia over HTTPS
 *      or localhost; a tenant site opened over plain HTTP (e.g.
 *      tenant.example.com or a LAN IP) gets `undefined` in full-featured
 *      Chrome/Edge/Firefox/Safari.
 *
 * Returns { supported, reason } where reason ∈
 *   "ok" | "ssr" | "insecure" | "no_webrtc" | "no_media".
 * "ssr" is transient — recompute in a client effect (useCallCapability).
 */
export function callCapability() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { supported: false, reason: "ssr" };
  }
  const hasRTC =
    typeof window.RTCPeerConnection === "function" ||
    typeof window.webkitRTCPeerConnection === "function";
  const md = navigator.mediaDevices;
  const hasGUM = !!md && typeof md.getUserMedia === "function";
  // isSecureContext is true on https AND on localhost/127.0.0.1/::1.
  const secure =
    typeof window.isSecureContext === "boolean" ? window.isSecureContext : true;

  if (hasGUM && hasRTC) return { supported: true, reason: "ok" };
  // mediaDevices missing on an insecure origin → it's the context, not the browser.
  if (!secure && !hasGUM) return { supported: false, reason: "insecure" };
  if (!hasRTC) return { supported: false, reason: "no_webrtc" };
  return { supported: false, reason: "no_media" };
}

export function mediaSupported() {
  return callCapability().supported;
}

// Human-readable copy for each non-ok reason.
export const CAPABILITY_MESSAGES = {
  insecure:
    "Calls need a secure (HTTPS) connection. Open this page over https:// to start a call.",
  no_webrtc: "This browser doesn’t support video calls. Try Chrome, Edge, Firefox, or Safari.",
  no_media: "Camera and microphone access isn’t available in this browser.",
};

/**
 * useCallCapability — SSR-safe capability. Renders nothing meaningful on
 * the server (reason "ssr"), then resolves the real capability after mount
 * so a secure browser is never mislabelled "unsupported".
 */
export function useCallCapability() {
  const [cap, setCap] = useState({ supported: false, reason: "ssr" });
  useEffect(() => {
    // Client-only probe: server and first client render both read "ssr"
    // (identical markup → no hydration mismatch); the real capability is
    // resolved here after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCap(callCapability());
  }, []);
  return cap;
}

export default function useMediaDevices() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);

  // Keep a ref in lockstep so cleanup/stop always sees the latest
  // stream without stale closures.
  const streamRef = useRef(null);
  streamRef.current = stream;

  const refreshCameras = useCallback(async () => {
    if (!mediaSupported() || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((d) => d.kind === "videoinput"));
    } catch {}
  }, []);

  const start = useCallback(
    async ({ audio = true, video = true } = {}) => {
      if (!mediaSupported()) {
        const e = new Error("Media devices are not supported in this browser.");
        setError(e);
        throw e;
      }
      setStarting(true);
      setError(null);
      try {
        const constraints = {
          audio,
          video: video ? { facingMode: "user" } : false,
        };
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(s);
        setAudioEnabled(s.getAudioTracks().some((t) => t.enabled));
        setVideoEnabled(s.getVideoTracks().some((t) => t.enabled));
        const track = s.getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings ? track.getSettings() : {};
          setCurrentCameraId(settings.deviceId || null);
        }
        // Labels are only populated after permission is granted.
        refreshCameras();
        return s;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setStarting(false);
      }
    },
    [refreshCameras]
  );

  const stop = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      try {
        s.getTracks().forEach((t) => t.stop());
      } catch {}
    }
    setStream(null);
    setCurrentCameraId(null);
  }, []);

  const toggleAudio = useCallback((on) => {
    const s = streamRef.current;
    if (!s) return false;
    const tracks = s.getAudioTracks();
    if (!tracks.length) return false;
    const next = typeof on === "boolean" ? on : !tracks[0].enabled;
    tracks.forEach((t) => {
      t.enabled = next;
    });
    setAudioEnabled(next);
    return next;
  }, []);

  const toggleVideo = useCallback((on) => {
    const s = streamRef.current;
    if (!s) return false;
    const tracks = s.getVideoTracks();
    if (!tracks.length) return false;
    const next = typeof on === "boolean" ? on : !tracks[0].enabled;
    tracks.forEach((t) => {
      t.enabled = next;
    });
    setVideoEnabled(next);
    return next;
  }, []);

  // Swap the camera track in-place on the local MediaStream. Returns
  // the new video track so the mesh hook can replaceTrack() on every
  // peer sender (no renegotiation needed for replaceTrack).
  const switchCamera = useCallback(
    async (deviceId) => {
      if (!mediaSupported()) return null;
      const s = streamRef.current;
      if (!s) return null;

      let targetId = deviceId;
      if (!targetId && cameras.length > 1) {
        const idx = cameras.findIndex((c) => c.deviceId === currentCameraId);
        targetId = cameras[(idx + 1) % cameras.length].deviceId;
      }

      const constraints = {
        video: targetId ? { deviceId: { exact: targetId } } : { facingMode: "environment" },
        audio: false,
      };
      const fresh = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = fresh.getVideoTracks()[0];
      if (!newTrack) return null;

      // Preserve the current enabled state.
      newTrack.enabled = videoEnabled;

      const oldTrack = s.getVideoTracks()[0];
      if (oldTrack) {
        s.removeTrack(oldTrack);
        oldTrack.stop();
      }
      s.addTrack(newTrack);

      const settings = newTrack.getSettings ? newTrack.getSettings() : {};
      setCurrentCameraId(settings.deviceId || targetId || null);
      // Force a new stream identity so consumers re-render the preview.
      setStream(s);
      return newTrack;
    },
    [cameras, currentCameraId, videoEnabled]
  );

  // Stop tracks on unmount so we never leak the camera light.
  useEffect(() => {
    return () => {
      const s = streamRef.current;
      if (s) {
        try {
          s.getTracks().forEach((t) => t.stop());
        } catch {}
      }
    };
  }, []);

  return {
    stream,
    error,
    starting,
    audioEnabled,
    videoEnabled,
    cameras,
    currentCameraId,
    start,
    stop,
    toggleAudio,
    toggleVideo,
    switchCamera,
    refreshCameras,
    supported: mediaSupported(),
  };
}
