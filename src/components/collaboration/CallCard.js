"use client";

/**
 * CallCard — an in-feed card representing one collaboration session,
 * rendered inside ConversationFeed (as a timeline item) and as the
 * incoming-call banner.
 *
 * It adapts to the session lifecycle:
 *   ringing/pending  → "Incoming call" (Join / Decline) for the callee,
 *                      "Calling…" (Cancel) for the initiator
 *   active           → "Call in progress" (Join)
 *   ended            → "Call ended · 4m 12s"
 *   missed           → "Missed call"
 *   rejected         → "Call declined"
 *   cancelled        → "Call cancelled"
 *
 * Props:
 *   session   serialized CollaborationSession
 *   viewer    "customer" | "admin" | "provider"
 *   isInitiator  did this viewer start the call (created_by === me)
 *   busy      disable buttons during a REST round-trip
 *   onJoin, onDecline, onCancel  → callbacks (may be omitted)
 *   variant   "feed" (default, compact) | "banner" (prominent)
 */

import { Phone, PhoneIncoming, PhoneMissed, PhoneOff, Video } from "lucide-react";

const LIVE = ["pending", "ringing", "active"];

function durationLabel(session) {
  const start = session?.started_at ? new Date(session.started_at) : null;
  const end = session?.ended_at ? new Date(session.ended_at) : null;
  if (!start || !end) return null;
  const secs = Math.max(0, Math.round((end - start) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function descriptor(session, isInitiator) {
  const media = session?.media_type === "audio" ? "Audio call" : "Video call";
  switch (session?.status) {
    case "pending":
    case "ringing":
      return isInitiator
        ? { title: `Calling…`, sub: media, tone: "live", icon: Phone }
        : { title: "Incoming call", sub: media, tone: "live", icon: PhoneIncoming };
    case "active":
      return { title: "Call in progress", sub: media, tone: "live", icon: Video };
    case "ended": {
      const d = durationLabel(session);
      return { title: "Call ended", sub: d ? `${media} · ${d}` : media, tone: "done", icon: PhoneOff };
    }
    case "missed":
      return { title: "Missed call", sub: media, tone: "missed", icon: PhoneMissed };
    case "rejected":
      return { title: "Call declined", sub: media, tone: "muted", icon: PhoneOff };
    case "cancelled":
      return { title: "Call cancelled", sub: media, tone: "muted", icon: PhoneOff };
    default:
      return { title: media, sub: "", tone: "muted", icon: Phone };
  }
}

const TONE = {
  live: "text-emerald-700 bg-emerald-50 border-emerald-200",
  done: "text-gray-700 bg-gray-50 border-gray-200",
  missed: "text-rose-700 bg-rose-50 border-rose-200",
  muted: "text-gray-500 bg-gray-50 border-gray-200",
};

export default function CallCard({
  session,
  viewer = "customer",
  isInitiator = false,
  busy = false,
  onJoin,
  onDecline,
  onCancel,
  variant = "feed",
}) {
  if (!session) return null;
  const d = descriptor(session, isInitiator);
  const Icon = d.icon;
  const live = LIVE.includes(session.status);
  const banner = variant === "banner";

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5",
        TONE[d.tone] || TONE.muted,
        banner ? "shadow-lg" : "",
      ].join(" ")}
      role="group"
      aria-label={d.title}
    >
      <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/70 shrink-0">
        <Icon className={`w-4.5 h-4.5 ${live ? "" : "opacity-70"}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight truncate">{d.title}</p>
        {d.sub && <p className="text-[11px] opacity-80 truncate">{d.sub}</p>}
      </div>

      {live && (
        <div className="flex items-center gap-2 shrink-0">
          {/* Callee on a ringing call: Join + Decline */}
          {!isInitiator && (session.status === "ringing" || session.status === "pending") && (
            <>
              <button
                type="button"
                onClick={onDecline}
                disabled={busy}
                className="h-8 px-3 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onJoin}
                disabled={busy}
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Join
              </button>
            </>
          )}

          {/* Initiator while ringing: Cancel */}
          {isInitiator && (session.status === "ringing" || session.status === "pending") && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-8 px-3 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {/* Active call: anyone not in it can Join */}
          {session.status === "active" && (
            <button
              type="button"
              onClick={onJoin}
              disabled={busy}
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Join
            </button>
          )}
        </div>
      )}
    </div>
  );
}
