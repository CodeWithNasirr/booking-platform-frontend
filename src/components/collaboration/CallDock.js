"use client";

/**
 * CallDock — the drop-in call surface for an order/booking page.
 *
 * One line wires a whole conversation into voice/video/screen-share:
 *
 *   <CallDock
 *     subjectType="order" subjectId={orderId}
 *     tenantId={tenantId} auth={{ jwt }} selfUserId={user.id}
 *     selfName={user.name} canStart={collaborable}
 *   />
 *
 * Responsibilities:
 *   * subscribe to the subject topic (order:<id> / booking:<id>) for
 *     session.* events so an incoming call rings instantly,
 *   * hydrate a call already in progress on mount (REST history),
 *   * render the Start controls, the incoming/ongoing CallCard banner,
 *     and the full CallPanel (in a modal) once we're in a call,
 *   * own the REST entry points (start / join / reject) and hand the
 *     resulting live session to CallPanel, which runs the media + mesh
 *     and leaves on hang-up.
 *
 * Guests (order/booking magic-link) can't use the REST session API yet
 * (IsAuthenticated only — guest REST is a later milestone), so pass a
 * real `auth.jwt`. On guest pages, render nothing by leaving canStart
 * false and auth without a jwt.
 *
 * NOTE: this opens its own realtime subscription to the subject topic,
 * independent of the page's existing chat subscription. That keeps
 * wiring to a single component; a later pass can consolidate onto one
 * shared socket if desired.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, Video, PhoneCall } from "lucide-react";

import { useRealtime } from "@/lib/realtime";
import {
  startSession,
  joinSession,
  rejectSession,
  leaveSession,
  getSessionHistory,
  isSessionLive,
  MEDIA_AUDIO,
  MEDIA_VIDEO,
} from "@/lib/collaborationApi";
import { mediaSupported } from "@/hooks/useMediaDevices";
import Portal from "@/components/ui/Portal";
import CallCard from "./CallCard";
import CallPanel from "./CallPanel";

const TERMINAL = ["ended", "missed", "rejected", "cancelled"];

export default function CallDock({
  subjectType = "order",
  subjectId,
  tenantId,
  auth,
  selfUserId,
  selfName = "You",
  canStart = true,
  className = "",
}) {
  const [liveSession, setLiveSession] = useState(null); // ringing/active, not in it
  const [activeCall, setActiveCall] = useState(null); // { session, joinOnMount }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const activeIdRef = useRef(null);
  activeIdRef.current = activeCall?.session?.id || null;

  const subjectQuery =
    subjectType === "booking" ? { booking: subjectId } : { order: subjectId };
  const supported = mediaSupported();

  // ── hydrate an in-progress call on mount ──
  useEffect(() => {
    let cancelled = false;
    if (!subjectId || !tenantId) return undefined;
    (async () => {
      try {
        const rows = await getSessionHistory(tenantId, subjectQuery);
        const list = Array.isArray(rows) ? rows : rows?.results || [];
        const live = list.find((s) => isSessionLive(s));
        if (!cancelled && live) setLiveSession(live);
      } catch {
        // history is best-effort; realtime still delivers new calls
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, tenantId]);

  // ── realtime: session.* on the subject topic ──
  const handleEnvelope = useCallback((env) => {
    if (!env || env.entity_type !== "collaboration_session") return;
    const session = env.payload?.session;
    if (!session) return;

    const terminal = TERMINAL.includes(session.status);

    // Update / close the call we're currently in.
    if (activeIdRef.current && session.id === activeIdRef.current) {
      if (terminal) {
        setActiveCall(null);
      } else {
        setActiveCall((prev) =>
          prev ? { ...prev, session: { ...prev.session, ...session } } : prev
        );
      }
      return;
    }

    // Otherwise it drives the incoming/ongoing banner.
    if (terminal) {
      setLiveSession((prev) => (prev && prev.id === session.id ? null : prev));
    } else if (isSessionLive(session)) {
      setLiveSession(session);
    }
  }, []);

  useRealtime({
    topics: subjectId ? [`${subjectType}:${subjectId}`] : [],
    auth: auth || {},
    onEvent: handleEnvelope,
    onReconnect: () => {
      // Re-hydrate in case a call started while we were offline.
      getSessionHistory(tenantId, subjectQuery)
        .then((rows) => {
          const list = Array.isArray(rows) ? rows : rows?.results || [];
          const live = list.find((s) => isSessionLive(s));
          if (live && live.id !== activeIdRef.current) setLiveSession(live);
        })
        .catch(() => {});
    },
  });

  // ── actions ──
  const start = useCallback(
    async (mediaType) => {
      if (busy || !supported) return;
      setBusy(true);
      setError(null);
      try {
        const res = await startSession(tenantId, { ...subjectQuery, mediaType });
        const session = { ...res.session, ice_servers: res.ice_servers };
        setLiveSession(null);
        setActiveCall({ session, joinOnMount: false });
      } catch (e) {
        setError(e?.detail || e?.message || "Couldn't start the call.");
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, supported, tenantId, subjectType, subjectId]
  );

  const join = useCallback(async () => {
    if (busy || !liveSession || !supported) return;
    setBusy(true);
    setError(null);
    try {
      const res = await joinSession(tenantId, liveSession.id);
      const session = { ...res.session, ice_servers: res.ice_servers };
      setLiveSession(null);
      // We already joined via REST here, so CallPanel must NOT re-join.
      setActiveCall({ session, joinOnMount: false });
    } catch (e) {
      setError(e?.detail || e?.message || "Couldn't join the call.");
    } finally {
      setBusy(false);
    }
  }, [busy, liveSession, supported, tenantId]);

  const decline = useCallback(async () => {
    if (!liveSession) return;
    const id = liveSession.id;
    setLiveSession(null);
    try {
      await rejectSession(tenantId, id);
    } catch {}
  }, [liveSession, tenantId]);

  const cancel = useCallback(async () => {
    if (!liveSession) return;
    const id = liveSession.id;
    setLiveSession(null);
    try {
      await leaveSession(tenantId, id);
    } catch {}
  }, [liveSession, tenantId]);

  const closePanel = useCallback(() => setActiveCall(null), []);

  const isInitiator =
    !!liveSession &&
    selfUserId != null &&
    String(liveSession.created_by) === String(selfUserId);

  // ── render ──
  const showStart = canStart && supported && !liveSession && !activeCall;

  return (
    <div className={className}>
      {error && (
        <p className="mb-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}

      {liveSession && !activeCall && (
        <div className="mb-2">
          <CallCard
            session={liveSession}
            isInitiator={isInitiator}
            busy={busy}
            onJoin={join}
            onDecline={decline}
            onCancel={cancel}
            variant="banner"
          />
        </div>
      )}

      {showStart && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => start(MEDIA_VIDEO)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium bg-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary-fg,#fff)] hover:brightness-110 disabled:opacity-50"
          >
            <Video className="w-4 h-4" /> Video call
          </button>
          <button
            type="button"
            onClick={() => start(MEDIA_AUDIO)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Phone className="w-4 h-4" /> Audio
          </button>
        </div>
      )}

      {canStart && !supported && (
        <p className="text-xs text-gray-400 inline-flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5" /> Calls aren’t supported in this browser.
        </p>
      )}

      {activeCall && (
        <Portal>
          <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-4xl h-[70vh] max-h-[720px]">
              <CallPanel
                session={activeCall.session}
                tenantId={tenantId}
                auth={auth}
                selfName={selfName}
                joinOnMount={activeCall.joinOnMount}
                onClose={closePanel}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
