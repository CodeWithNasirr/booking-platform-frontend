// src/lib/collaborationApi.js
//
// REST client for the collaboration (voice / video / screen-share)
// session API. Works for BOTH authenticated staff/customers (JWT) and
// tenant-site guests (scoped X-*-Token), so the same CallDock drives
// every surface.
//
// Every call takes an `auth` descriptor:
//   { tenantId, jwt }                                   staff / logged-in
//   { tenantId, guestToken, guestHeader: "X-Order-Token" | "X-Booking-Token" }
//
// Backend surface (apps/collaboration/urls.py):
//   GET  /api/v1/collaboration/ice-servers/
//   GET  /api/v1/collaboration/sessions/?order=<id> | ?booking=<id>
//   POST /api/v1/collaboration/sessions/                 { order|booking, media_type }
//   GET  /api/v1/collaboration/sessions/<id>/
//   POST /api/v1/collaboration/sessions/<id>/join/
//   POST /api/v1/collaboration/sessions/<id>/leave/
//   POST /api/v1/collaboration/sessions/<id>/reject/
//   POST /api/v1/collaboration/sessions/<id>/end/
//   POST /api/v1/collaboration/sessions/<id>/screen-share/  { on }
//
// start/join return { session, ice_servers }; the rest return the
// updated session. All the mesh WebRTC signaling happens over the
// realtime websocket (session:<id> topic), not here.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const BASE = "/api/v1/collaboration";

// ── Media / subject constants (mirror the backend model choices) ──
export const MEDIA_AUDIO = "audio";
export const MEDIA_VIDEO = "video";

export const SESSION_LIVE_STATUSES = ["pending", "ringing", "active"];
export const SESSION_TERMINAL_STATUSES = [
  "ended",
  "missed",
  "rejected",
  "cancelled",
];

export function isSessionLive(session) {
  return !!session && SESSION_LIVE_STATUSES.includes(session.status);
}

// ── Guest header helper: pick the right X-*-Token for a subject ──
export function guestHeaderFor(subjectType) {
  return subjectType === "booking" ? "X-Booking-Token" : "X-Order-Token";
}

// ── Core fetch: build headers from the auth descriptor ──
// `keepalive` lets a leave request survive a page unload (tab close /
// navigation) — unlike sendBeacon it can still carry the auth header.
async function call(auth, endpoint, { method = "GET", body, keepalive = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth?.tenantId) headers["X-Tenant"] = auth.tenantId;
  if (auth?.jwt) headers["Authorization"] = `Bearer ${auth.jwt}`;
  if (auth?.guestToken && auth?.guestHeader) {
    headers[auth.guestHeader] = auth.guestToken;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    keepalive,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.detail = data.detail;
    err.code = data.code;
    throw err;
  }
  return data;
}

// ── ICE servers (STUN always, TURN when the tenant has coturn) ──
export function getIceServers(auth) {
  return call(auth, `${BASE}/ice-servers/`);
}

// ── Call history for one subject (participant only) ──
export function getSessionHistory(auth, { order, booking } = {}) {
  const qs = order
    ? `?order=${encodeURIComponent(order)}`
    : booking
    ? `?booking=${encodeURIComponent(booking)}`
    : "";
  return call(auth, `${BASE}/sessions/${qs}`);
}

// ── Start (or rejoin) a call → { session, ice_servers } ──
export function startSession(auth, { order, booking, mediaType = MEDIA_VIDEO } = {}) {
  const body = { media_type: mediaType };
  if (order) body.order = order;
  if (booking) body.booking = booking;
  return call(auth, `${BASE}/sessions/`, { method: "POST", body });
}

export function getSession(auth, sessionId) {
  return call(auth, `${BASE}/sessions/${sessionId}/`);
}

// ── Join → { session, ice_servers } ──
export function joinSession(auth, sessionId) {
  return call(auth, `${BASE}/sessions/${sessionId}/join/`, { method: "POST", body: {} });
}

export function leaveSession(auth, sessionId, { keepalive = false } = {}) {
  return call(auth, `${BASE}/sessions/${sessionId}/leave/`, {
    method: "POST",
    body: {},
    keepalive,
  });
}

export function rejectSession(auth, sessionId) {
  return call(auth, `${BASE}/sessions/${sessionId}/reject/`, { method: "POST", body: {} });
}

export function endSession(auth, sessionId) {
  return call(auth, `${BASE}/sessions/${sessionId}/end/`, { method: "POST", body: {} });
}

export function setScreenShare(auth, sessionId, on) {
  return call(auth, `${BASE}/sessions/${sessionId}/screen-share/`, {
    method: "POST",
    body: { on: !!on },
  });
}
