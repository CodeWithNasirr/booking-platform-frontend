"use client";

/**
 * CallStage — the video grid. Renders the local preview plus one tile
 * per remote peer, choosing a column count that keeps tiles roughly
 * square as the party grows (1→1col, 2→2col, 3-4→2col, 5+→3col).
 *
 * Presentational only: it receives already-resolved streams from
 * CallPanel (which owns useMediaDevices + useWebRTCSession). That keeps
 * the SFU migration seam clean — swap how streams arrive without
 * touching layout.
 *
 * Props:
 *   localStream, localLabel, audioEnabled, videoEnabled, sharingScreen
 *   remotes         [{ id, stream, connectionState, label?, audioMuted?, sharingScreen? }]
 *   audioOnly       hint for the empty/1-1 state copy
 */

import VideoTile from "./VideoTile";

function columnsFor(count) {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

export default function CallStage({
  localStream,
  localLabel = "You",
  audioEnabled = true,
  videoEnabled = true,
  sharingScreen = false,
  remotes = [],
  audioOnly = false,
}) {
  // Total tiles = local + remotes. Local always shown so the user can
  // confirm their own camera/mic.
  const tileCount = 1 + remotes.length;

  return (
    <div className="w-full h-full min-h-0">
      <div className={`grid ${columnsFor(tileCount)} gap-2 w-full h-full auto-rows-fr`}>
        {remotes.map((r) => (
          <VideoTile
            key={r.id}
            stream={r.stream}
            label={r.label}
            audioMuted={r.audioMuted}
            sharingScreen={r.sharingScreen}
            connectionState={r.connectionState}
          />
        ))}

        <VideoTile
          stream={localStream}
          label={localLabel}
          isLocal
          mirror={!sharingScreen}
          muted
          audioMuted={!audioEnabled}
          sharingScreen={sharingScreen}
        />
      </div>

      {remotes.length === 0 && (
        <p className="mt-3 text-center text-xs text-white/60">
          {audioOnly
            ? "Waiting for the other person to join the call…"
            : "Waiting for the other person to join — they’ll appear here."}
        </p>
      )}
    </div>
  );
}
