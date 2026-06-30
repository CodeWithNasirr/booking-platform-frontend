// src/lib/realtimePatches.js
//
// Helpers for applying realtime envelopes onto an in-memory entity.
// Backend sends fully-serialized payloads so the frontend doesn't
// have to refetch on every event. The functions here keep the
// per-page reducers tiny.
//
// Envelope shape:
//   {
//     topic, event, entity_type, entity_id,
//     occurred_at, payload, context
//   }
//
// Custom request entity types:
//   custom_request.message       → append/replace in messages[]
//   custom_request.timeline_event → append in timeline[]
//   custom_request.quote         → replace in quotes[] (by id)
//   custom_request.status        → patch status + summary
//   custom_request.assignment    → patch provider_* fields
//   custom_request.attachment    → append in files[]
//   custom_request.summary       → list-row update for the tenant feed

function dedupeById(arr) {
  const seen = new Map();
  for (const item of arr) {
    if (item && item.id != null) seen.set(item.id, item);
  }
  return Array.from(seen.values());
}

function replaceOrAppendById(arr, item) {
  const out = (arr || []).map((x) => (x.id === item.id ? item : x));
  if (!out.some((x) => x.id === item.id)) out.push(item);
  return out;
}

export function applyRequestEnvelope(request, envelope) {
  if (!request || !envelope?.entity_type) return request;

  const next = { ...request };
  const p = envelope.payload || {};

  switch (envelope.entity_type) {
    case "custom_request.message": {
      const messages = dedupeById([...(next.messages || []), p]);
      next.messages = messages.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      return next;
    }
    case "custom_request.timeline_event": {
      const timeline = dedupeById([...(next.timeline || []), p]);
      next.timeline = timeline.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      return next;
    }
    case "custom_request.quote": {
      next.quotes = replaceOrAppendById(next.quotes, p);
      return next;
    }
    case "custom_request.status": {
      next.status = p.status;
      if (p.summary) Object.assign(next, pickSummaryFields(p.summary));
      return next;
    }
    case "custom_request.assignment": {
      next.provider = p.provider_id;
      next.provider_name = p.provider_name;
      if (p.summary) Object.assign(next, pickSummaryFields(p.summary));
      return next;
    }
    case "custom_request.attachment": {
      next.files = dedupeById([...(next.files || []), p]);
      return next;
    }
    default:
      return next;
  }
}

function pickSummaryFields(summary) {
  // Whitelist — summary only patches list-relevant fields so we
  // don't accidentally wipe loaded relations.
  const allowed = [
    "status", "title", "request_number",
    "customer_name", "customer_email",
    "provider_name", "budget_max", "deadline", "updated_at",
  ];
  const out = {};
  for (const key of allowed) if (key in summary) out[key] = summary[key];
  return out;
}

/**
 * applyOrderEnvelope — patch a single Order object in-place from
 * an `order.*` realtime envelope. Mirrors applyRequestEnvelope:
 * subscribers update local state without round-tripping the REST
 * detail endpoint.
 *
 * Backend entity types (see apps.realtime.service.RealtimeService):
 *   order.status   → patch status + total_amount + currency +
 *                    order_number + updated_at
 *   order.summary  → same shape (used on tenant feed)
 *
 * Unknown entity types pass through unchanged so future
 * envelopes never silently drop the existing order state.
 */
export function applyOrderEnvelope(order, envelope) {
  if (!envelope?.entity_type) return order;
  if (envelope.entity_type !== "order.status"
      && envelope.entity_type !== "order.summary") {
    return order;
  }
  const p = envelope.payload || {};
  const next = order ? { ...order } : { id: envelope.entity_id };
  for (const key of ["status", "total_amount", "currency", "order_number", "updated_at"]) {
    if (key in p) next[key] = p[key];
  }
  return next;
}

export function applyTenantRequestSummary(list, envelope) {
  if (!Array.isArray(list) || envelope?.entity_type !== "custom_request.summary") {
    return list;
  }
  const p = envelope.payload || {};
  const found = list.some((r) => r.id === p.id);
  if (!found) return [p, ...list];
  return list.map((r) => (r.id === p.id ? { ...r, ...p } : r));
}
