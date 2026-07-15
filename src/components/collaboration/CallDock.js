"use client";

/**
 * CallDock — the drop-in call surface for an order/booking page. One
 * component turns a conversation into voice/video/screen-share for BOTH
 * authenticated staff and tenant-site guest customers.
 *
 *   // staff / logged-in (JWT)
 *   <CallDock subjectType="order" subjectId={id} tenantId={t}
 *             authMode="jwt" jwt={access} selfUserId={u.id}
 *             selfName={u.name} canStart={collaborable} />
 *
 *   // tenant-site guest (scoped OTP token)
 *   <CallDock subjectType="booking" subjectId={id} tenantId={t}
 *             authMode="guest" guestToken={token} selfName={name}
 *             canStart={collaborable} />
 *
 * Auth plumbing (derived from the props):
 *   restAuth — collaborationApi descriptor. JWT → { tenantId, jwt };
 *              guest → { tenantId, guestToken, guestHeader } where the
 *              header is X-Order-Token / X-Booking-Token for the subject.
 *   wsAuth   — openRealtimeSocket auth. JWT → { jwt }; guest →
 *              { orderToken } or { bookingToken } for the subject.
 *
 * Responsibilities:
 *   * subscribe to the subject topic (order:<id> / booking:<id>) for
 *     session.* events so an incoming call rings instantly,
 *   * hydrate a call already in progress on mount (REST history),
 *   * render the Start controls, the incoming/ongoing CallCard banner,
 *     and the full CallPanel (in a modal) once we're in a call,
 *   * own the REST entry points (start / join / reject) and hand the
 *     resulting live session to CallPanel.
 *
 * NOTE: opens its own realtime subscription to the subject topic,
 * independent of the page's chat subscription — keeps wiring to a single
 * component. A later pass can consolidate onto one shared socket.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Phone, Video, PhoneCall } from "lucide-react";

import { useRealtime } from "@/lib/realtime";
import {
  startSession,
  joinSession,
  rejectSession,
  leaveSession,
  getSessionHistory,
  isSessionLive,
  guestHeaderFor,
  MEDIA_AUDIO,
  MEDIA_VIDEO,
} from "@/lib/collaborationApi";
import { useCallCapability, CAPABILITY_MESSAGES } from "@/hooks/useMediaDevices";
import Portal from "@/components/ui/Portal";
import CallCard from "./CallCard";
import CallPanel from "./CallPanel";

const TERMINAL = ["ended", "missed", "rejected", "cancelled"];

export default function CallDock({
  subjectType = "order",
  subjectId,
  tenantId,
  authMode = "jwt", // "jwt" | "guest"
  jwt = null, // jwt mode
  guestToken = null, // guest mode
  selfUserId = null,
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

  const subjectQuery = useMemo(
    () => (subjectType === "booking" ? { booking: subjectId } : { order: subjectId }),
    [subjectType, subjectId]
  );
  const capability = useCallCapability();
  const supported = capability.supported;
  const isGuest = authMode === "guest";

  // REST auth descriptor for collaborationApi.
  const restAuth = useMemo(() => {
    if (isGuest) {
      return {
        tenantId,
        guestToken,
        guestHeader: guestHeaderFor(subjectType),
      };
    }
    return { tenantId, jwt };
  }, [isGuest, tenantId, guestToken, subjectType, jwt]);

  // WS auth for openRealtimeSocket (subject topic + signaling).
  const wsAuth = useMemo(() => {
    if (isGuest) {
      return subjectType === "booking"
        ? { bookingToken: guestToken }
        : { orderToken: guestToken };
    }
    return { jwt };
  }, [isGuest, subjectType, guestToken, jwt]);

  const hasAuth = isGuest ? !!guestToken : !!jwt;

  // ── hydrate an in-progress call on mount ──
  useEffect(() => {
    let cancelled = false;
    if (!subjectId || !tenantId || !hasAuth) return undefined;
    (async () => {
      try {
        const rows = await getSessionHistory(restAuth, subjectQuery);
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
  }, [subjectId, tenantId, hasAuth]);

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
    topics: subjectId && hasAuth ? [`${subjectType}:${subjectId}`] : [],
    auth: wsAuth,
    onEvent: handleEnvelope,
    onReconnect: () => {
      getSessionHistory(restAuth, subjectQuery)
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
        const res = await startSession(restAuth, { ...subjectQuery, mediaType });
        const session = { ...res.session, ice_servers: res.ice_servers };
        setLiveSession(null);
        setActiveCall({ session, joinOnMount: false });
      } catch (e) {
        setError(e?.detail || e?.message || "Couldn't start the call.");
      } finally {
        setBusy(false);
      }
    },
    [busy, supported, restAuth, subjectQuery]
  );

  const join = useCallback(async () => {
    if (busy || !liveSession || !supported) return;
    setBusy(true);
    setError(null);
    try {
      const res = await joinSession(restAuth, liveSession.id);
      const session = { ...res.session, ice_servers: res.ice_servers };
      setLiveSession(null);
      // We already joined via REST here, so CallPanel must NOT re-join.
      setActiveCall({ session, joinOnMount: false });
    } catch (e) {
      setError(e?.detail || e?.message || "Couldn't join the call.");
    } finally {
      setBusy(false);
    }
  }, [busy, liveSession, supported, restAuth]);

  const decline = useCallback(async () => {
    if (!liveSession) return;
    const id = liveSession.id;
    setLiveSession(null);
    try {
      await rejectSession(restAuth, id);
    } catch {}
  }, [liveSession, restAuth]);

  const cancel = useCallback(async () => {
    if (!liveSession) return;
    const id = liveSession.id;
    setLiveSession(null);
    try {
      await leaveSession(restAuth, id);
    } catch {}
  }, [liveSession, restAuth]);

  const closePanel = useCallback(() => setActiveCall(null), []);

  const isInitiator =
    !!liveSession &&
    selfUserId != null &&
    String(liveSession.created_by) === String(selfUserId);

  // ── render ──
  const showStart = canStart && supported && hasAuth && !liveSession && !activeCall;

  if (!hasAuth) return null;

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

      {/* Only surface a reason once we've actually probed on the client
          (reason "ssr" means "not determined yet" — stay silent). */}
      {canStart && !supported && capability.reason !== "ssr" && (
        <p className="text-xs text-gray-400 inline-flex items-start gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {CAPABILITY_MESSAGES[capability.reason] ||
            "Calls aren’t available in this browser."}
        </p>
      )}

      {activeCall && (
        <Portal>
          <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-4xl h-[70vh] max-h-[720px]">
              <CallPanel
                session={activeCall.session}
                restAuth={restAuth}
                wsAuth={wsAuth}
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
