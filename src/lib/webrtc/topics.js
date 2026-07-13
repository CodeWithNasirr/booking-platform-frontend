// src/lib/webrtc/topics.js
//
// Topic name builders — must match apps/realtime/topics.py on the
// backend so the client subscribes to the exact group the server
// publishes to.

export function order(id) {
  return `order:${id}`;
}

export function booking(id) {
  return `booking:${id}`;
}

export function session(id) {
  return `session:${id}`;
}
