"use client";

/**
 * VideoTile — binds a MediaStream to a <video> element and overlays
 * participant chrome (name, muted mic, connection state, screen-share
 * badge). Falls back to an avatar/initial when there is no live video
 * track (camera off or audio-only call).
 *
 * Props:
 *   stream           MediaStream | null
 *   label            display name
 *   muted            mute the <video> audio element (always true for the
 *                    local tile to avoid feedback)
 *   mirror           flip horizontally (local camera preview)
 *   isLocal          styling hint + "You" affordance
 *   audioMuted       show the muted-mic badge
 *   sharingScreen    show the screen-share badge + object-contain fit
 *   connectionState  RTCPeerConnectionState for remote tiles
 */

import { useEffect, useRef } from "react";
import { MicOff, MonitorUp, Loader2, WifiOff } from "lucide-react";

function hasVideo(stream) {
  if (!stream) return false;
  return stream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled);
}

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export default function VideoTile({
  stream,
  label = "",
  muted = false,
  mirror = false,
  isLocal = false,
  audioMuted = false,
  sharingScreen = false,
  connectionState,
}) {
  const videoRef = useRef(null);

  // Keep the <video> element's srcObject in lockstep with the stream.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream || null;
    }
  }, [stream]);

  const showVideo = hasVideo(stream);
  const connecting =
    !isLocal &&
    connectionState &&
    connectionState !== "connected" &&
    connectionState !== "completed";
  const failed = connectionState === "failed" || connectionState === "closed";

  return (
    <div className="relative w-full h-full min-h-0 rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className={[
          "w-full h-full",
          sharingScreen ? "object-contain bg-black" : "object-cover",
          mirror ? "scale-x-[-1]" : "",
          showVideo ? "" : "hidden",
        ].join(" ")}
      />

      {!showVideo && (
        <div className="flex flex-col items-center justify-center gap-2 text-white/90">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-semibold">
            {initials(label)}
          </div>
        </div>
      )}

      {/* connection state overlay for remote tiles */}
      {connecting && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs gap-2">
          <WifiOff className="w-4 h-4" /> Reconnecting…
        </div>
      )}

      {/* bottom-left name chip */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 max-w-[calc(100%-1rem)]">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/55 text-white text-[11px] font-medium truncate">
          {audioMuted && <MicOff className="w-3 h-3 shrink-0 text-rose-300" />}
          <span className="truncate">{isLocal ? `${label || "You"} (You)` : label || "Guest"}</span>
        </span>
        {sharingScreen && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color:var(--brand-primary,#3B82F6)] text-white text-[11px] font-medium">
            <MonitorUp className="w-3 h-3" /> Sharing
          </span>
        )}
      </div>
    </div>
  );
}
