"use client";

/**
 * CallControlBar — the in-call action bar: mic, camera, screen share,
 * switch camera, hang up. Pure presentation; every action is a
 * callback owned by CallPanel.
 *
 * Buttons collapse gracefully: screen-share and switch-camera hide when
 * the platform/browser can't do them (canScreenShare / canSwitchCamera).
 */

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorX,
  SwitchCamera,
  PhoneOff,
} from "lucide-react";

function CtrlButton({ onClick, active, danger, disabled, label, children }) {
  const base =
    "inline-flex items-center justify-center w-11 h-11 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-40 disabled:cursor-not-allowed";
  const tone = danger
    ? "bg-rose-600 text-white hover:bg-rose-700"
    : active
    ? "bg-white text-gray-900 hover:bg-white/90"
    : "bg-white/15 text-white hover:bg-white/25";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={danger ? undefined : !!active}
      title={label}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  );
}

export default function CallControlBar({
  audioEnabled = true,
  videoEnabled = true,
  sharingScreen = false,
  audioOnly = false,
  canScreenShare = true,
  canSwitchCamera = false,
  busy = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onSwitchCamera,
  onHangUp,
}) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-3">
      <CtrlButton
        onClick={onToggleAudio}
        active={audioEnabled}
        label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </CtrlButton>

      {!audioOnly && (
        <CtrlButton
          onClick={onToggleVideo}
          active={videoEnabled}
          label={videoEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </CtrlButton>
      )}

      {/* Screen share needs an outgoing video sender to swap onto. An
          audio-only call has none, so replaceTrack would share locally
          but transmit nothing — gate it to video calls. */}
      {canScreenShare && !audioOnly && (
        <CtrlButton
          onClick={onToggleScreenShare}
          active={sharingScreen}
          disabled={busy}
          label={sharingScreen ? "Stop sharing screen" : "Share screen"}
        >
          {sharingScreen ? (
            <MonitorX className="w-5 h-5" />
          ) : (
            <MonitorUp className="w-5 h-5" />
          )}
        </CtrlButton>
      )}

      {canSwitchCamera && !audioOnly && (
        <CtrlButton
          onClick={onSwitchCamera}
          label="Switch camera"
          disabled={!videoEnabled || sharingScreen}
        >
          <SwitchCamera className="w-5 h-5" />
        </CtrlButton>
      )}

      <CtrlButton onClick={onHangUp} danger label="Leave call">
        <PhoneOff className="w-5 h-5" />
      </CtrlButton>
    </div>
  );
}
