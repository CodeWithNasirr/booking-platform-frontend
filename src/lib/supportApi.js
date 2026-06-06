// src/lib/supportApi.js
/**
 * Support & Announcements API Client (Tenant Side)
 *
 * Used by:
 *   FloatingSupportButton  → create ticket, view recent
 *   /dashboard/support     → full ticket list + conversation
 *   AnnouncementBanner     → fetch active announcements
 *
 * Backend endpoints (already exist):
 *   GET  /api/v1/tenant/support/tickets/                   → list (filtered by tenant via header)
 *   POST /api/v1/tenant/support/tickets/create/            → create
 *   GET  /api/v1/tenant/support/tickets/<id>/              → detail
 *   GET  /api/v1/tenant/support/tickets/<id>/messages/     → conversation thread
 *   POST /api/v1/tenant/support/tickets/<id>/reply/         → tenant reply
 *   POST /api/v1/tenant/support/tickets/<id>/status/        → tenant closes own ticket
 *   GET  /api/v1/platform/announcements/?active=true → active announcements
 */

// src/lib/supportApi.js

/**
 * Support & Announcements API Client (Tenant Side)
 */

import { apiFetch } from "@/lib/apiClient";

// ═══════════════════════════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════════════════════════

export async function createTicket(
  tenantSlug,
  {
    subject,
    description,
    category,
    priority,
    attachments = [],
  }
) {
  return apiFetch(
    `/api/v1/tenant/support/tickets/create/`,
    tenantSlug,
    {
      method: "POST",
      body: JSON.stringify({
        subject,
        description,
        category,
        priority,
        attachments,
      }),
    }
  );
}

export async function fetchMyTickets(
  tenantSlug,
  params = {}
) {
  const qs = new URLSearchParams(params).toString();

  return apiFetch(
    `/api/v1/tenant/support/tickets/${qs ? `?${qs}` : ""}`,
    tenantSlug
  );
}

export async function fetchTicketDetail(
  tenantSlug,
  ticketId
) {
  return apiFetch(
    `/api/v1/tenant/support/tickets/${ticketId}/`,
    tenantSlug
  );
}

export async function fetchTicketMessages(
  tenantSlug,
  ticketId
) {
  return apiFetch(
    `/api/v1/tenant/support/tickets/${ticketId}/messages/?include_internal=false`,
    tenantSlug
  );
}

export async function replyToTicket(
  tenantSlug,
  ticketId,
  content,
  attachments = []
) {
  return apiFetch(
    `/api/v1/tenant/support/tickets/${ticketId}/reply/`,
    tenantSlug,
    {
      method: "POST",
      body: JSON.stringify({
        content,
        sender_type: "customer",
        attachments,
      }),
    }
  );
}

export async function closeMyTicket(
  tenantSlug,
  ticketId
) {
  return apiFetch(
    `/api/v1/tenant/support/tickets/${ticketId}/status/`,
    tenantSlug,
    {
      method: "POST",
      body: JSON.stringify({
        status: "closed",
      }),
    }
  );
}

// ═══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════

export async function fetchActiveAnnouncements(
  tenantSlug
) {
  return apiFetch(
    `/api/v1/tenant/announcements/?active=true`,
    tenantSlug
  );
}

export async function markAnnouncementRead(
  tenantSlug,
  announcementId
) {
  return apiFetch(
    `/api/v1/tenant/announcements/${announcementId}/read/`,
    tenantSlug,
    {
      method: "POST",
    }
  );
}