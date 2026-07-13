// src/lib/collaborationApi.js
//
// REST client for the collaboration (voice / video / screen-share)
// session API. Thin wrappers over apiFetch so every call carries the
// JWT + X-Tenant headers the backend expects.
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

import { apiFetch } from "@/lib/apiClient";

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

// ── ICE servers (STUN always, TURN when the tenant has coturn) ──
export function getIceServers(tenantId) {
  return apiFetch(`${BASE}/ice-servers/`, tenantId);
}

// ── Call history for one subject (participant only) ──
export function getSessionHistory(tenantId, { order, booking } = {}) {
  const qs = order
    ? `?order=${encodeURIComponent(order)}`
    : booking
    ? `?booking=${encodeURIComponent(booking)}`
    : "";
  return apiFetch(`${BASE}/sessions/${qs}`, tenantId);
}

// ── Start (or rejoin) a call → { session, ice_servers } ──
export function startSession(tenantId, { order, booking, mediaType = MEDIA_VIDEO } = {}) {
  const body = { media_type: mediaType };
  if (order) body.order = order;
  if (booking) body.booking = booking;
  return apiFetch(`${BASE}/sessions/`, tenantId, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getSession(tenantId, sessionId) {
  return apiFetch(`${BASE}/sessions/${sessionId}/`, tenantId);
}

// ── Join → { session, ice_servers } ──
export function joinSession(tenantId, sessionId) {
  return apiFetch(`${BASE}/sessions/${sessionId}/join/`, tenantId, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function leaveSession(tenantId, sessionId) {
  return apiFetch(`${BASE}/sessions/${sessionId}/leave/`, tenantId, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function rejectSession(tenantId, sessionId) {
  return apiFetch(`${BASE}/sessions/${sessionId}/reject/`, tenantId, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function endSession(tenantId, sessionId) {
  return apiFetch(`${BASE}/sessions/${sessionId}/end/`, tenantId, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function setScreenShare(tenantId, sessionId, on) {
  return apiFetch(`${BASE}/sessions/${sessionId}/screen-share/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ on: !!on }),
  });
}
