// src/app/tenant-site/[domain]/my-bookings/[bookingId]/BookingDetailClient.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutRenderer from "../../LayoutRenderer";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { CallDock } from "@/components/collaboration";
import BookingConversationPanel from "@/components/bookings/BookingConversationPanel";

import PortalBrandRoot from "@/app/tenant-site/components/portalBrand";
import { statusMeta, paymentMeta, isOnline } from "@/app/tenant-site/components/portalPresentation";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import Modal, { ModalFooter } from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  ArrowLeft, Calendar, Clock, MapPin, Video, User, CreditCard, Star,
  ExternalLink, XCircle, MessageSquare, Info, ListChecks,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveToken(tenantId) {
  try {
    if (tenantId) {
      const key = `customer_booking_token_${tenantId}`;
      const token = localStorage.getItem(key);
      if (token) return { token, type: "guest", tenantId };
    }

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("customer_booking_token_")) {
        const token = localStorage.getItem(key);
        if (token) {
          const storedTenantId = key.replace("customer_booking_token_", "");
          return { token, type: "guest", tenantId: storedTenantId };
        }
      }
    }

    const oldToken = localStorage.getItem("guest_booking_token");
    if (oldToken) return { token: oldToken, type: "guest", tenantId: null };

  } catch (e) {
    console.error("[BookingDetail] Error:", e);
  }

  return { token: null, type: null, tenantId: null };
}

function buildHeaders(domain, token) {
  const headers = { "Content-Type": "application/json" };
  if (domain) headers["X-Tenant"] = domain;
  if (token) {
    const bearerToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    headers["Authorization"] = bearerToken;
  }
  return headers;
}

// Guest calls to the main BookingViewSet must NOT use Authorization:
// its SimpleJWT authenticator rejects a guest booking token as an invalid
// AccessToken (401) before AllowAny is ever consulted. The booking token
// rides in X-Booking-Token instead — parity with orders' X-Order-Token —
// which _get_customer_booking reads for the guest path.
function buildGuestHeaders(domain, token, { json = true } = {}) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  if (domain) headers["X-Tenant"] = domain;
  if (token) headers["X-Booking-Token"] = token.replace(/^Bearer /, "");
  return headers;
}

export default function BookingDetailClient({
  domain,
  site,
  header,
  footer,
  bookingId,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  const tenantId = site?.tenant?.id || site?.id;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ── Secure "View Booking" magic link (?t=…) ──
  // Exchange the single-booking token from a confirmation / reminder /
  // review email for a guest booking session, store it the same way the
  // OTP flow does, then strip ?t= from the URL so it isn't re-used.
  useEffect(() => {
    if (!isClient) return;
    const t = searchParams.get("t");
    if (!t) { setTokenReady(true); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/guest-bookings/access-via-token/`,
          {
            method: "POST",
            headers: buildHeaders(domain, null),
            body: JSON.stringify({ t }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const tid = data.tenant_id || tenantId;
          if (data.token && tid) {
            localStorage.setItem(`customer_booking_token_${tid}`, data.token);
            if (data.email) localStorage.setItem(`customer_booking_email_${tid}`, data.email);
          }
        }
      } catch (e) {
        console.error("[BookingDetail] magic-link exchange failed:", e);
      } finally {
        // Drop ?t= from the URL regardless of outcome.
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("t");
          window.history.replaceState({}, "", url.toString());
        } catch {}
        if (!cancelled) setTokenReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isClient, searchParams, domain, tenantId]);

  const fetchBookingDetail = useCallback(async () => {
    if (!isClient) return;

    try {
      setLoading(true);
      setError(null);

      const auth = resolveToken(tenantId);
      console.log(`[BookingDetail] Looking for booking: ${bookingId}`);

      if (!auth.token) {
        router.replace(tenantRoutes.myBookings());
        return;
      }

      // Go straight to list endpoint (individual endpoint doesn't exist)
      const res = await fetch(
        `${API_BASE}/api/v1/guest-bookings/by-email/`,
        { headers: buildHeaders(domain, auth.token), credentials: 'include' }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(`customer_booking_token_${tenantId}`);
          localStorage.removeItem(`customer_booking_email_${tenantId}`);
          localStorage.removeItem("guest_booking_token");
          router.replace(tenantRoutes.myBookings());
          return;
        }
        throw new Error(`Failed: ${res.status}`);
      }

      const data = await res.json();
      const bookings = data.bookings || [];
      
      console.log(`[BookingDetail] Got ${bookings.length} bookings`);
      
      // Find booking by ID
      const found = bookings.find((b) => b.id === bookingId);
      console.log("[BookingDetail] Found:", found ? "YES" : "NO");

      if (!found) {
        setError("Booking not found or you don't have access.");
        setLoading(false);
        return;
      }

      setBooking(found);
    } catch (err) {
      console.error("[BookingDetail] Error:", err);
      setError(err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [domain, bookingId, tenantId, router, isClient]);

  useEffect(() => {
    if (isClient && tokenReady) fetchBookingDetail();
  }, [fetchBookingDetail, isClient, tokenReady]);

  // Guest booking token for the conversation panel (X-Booking-Token +
  // realtime), resolved from localStorage once the magic-link exchange
  // (if any) has settled.
  const guestToken = (() => {
    if (!isClient || !tokenReady) return null;
    const auth = resolveToken(tenantId);
    return (auth.token || "").replace(/^Bearer /, "") || null;
  })();

  const [cancelling, setCancelling] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [tab, setTab] = useState("chat"); // mobile: details | chat

  const submitReview = useCallback(async () => {
    const auth = resolveToken(tenantId);
    setReviewSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/bookings/${bookingId}/submit_review/`,
        {
          method: "POST",
          headers: buildGuestHeaders(domain, auth.token),
          body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || "Could not submit your review.");
      }
      setReviewOpen(false);
      setReviewComment("");
      await fetchBookingDetail();
    } catch (e) {
      alert(e.message || "Could not submit your review.");
    } finally {
      setReviewSubmitting(false);
    }
  }, [tenantId, domain, bookingId, reviewRating, reviewComment, fetchBookingDetail]);

  const handleCancelBooking = useCallback(async () => {
    const reason = window.prompt("Why are you cancelling this booking? (optional)", "");
    // prompt returns null when the customer dismisses the dialog — abort.
    if (reason === null) return;
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;

    const auth = resolveToken(tenantId);
    setCancelling(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/bookings/${bookingId}/cancel/`,
        {
          method: "POST",
          headers: buildGuestHeaders(domain, auth.token),
          body: JSON.stringify({ reason: reason || "Cancelled by customer" }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || "Could not cancel this booking.");
      }
      await fetchBookingDetail();
    } catch (e) {
      alert(e.message || "Could not cancel this booking.");
    } finally {
      setCancelling(false);
    }
  }, [tenantId, domain, bookingId, fetchBookingDetail]);

  const handleBack = () => router.push(tenantRoutes.myBookings());

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      pending_payment: "bg-orange-100 text-orange-800",
      paid: "bg-indigo-100 text-indigo-800",
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr, timeStr, timezone) => {
    if (!dateStr) return "N/A";
    let result = new Date(dateStr).toLocaleDateString();
    if (timeStr) {
      result += ` at ${timeStr}`;
    }
    if (timezone) {
      result += ` (${timezone})`;
    }
    return result;
  };

  const formatMoney = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  // ── Branded portal chrome wrappers ──
  const Chrome = ({ children }) => (
    <>
      {header?.length > 0 && <LayoutRenderer sections={[header]} site={site} />}
      <main className="min-h-screen bg-muted">{children}</main>
      {footer?.length > 0 && <LayoutRenderer sections={[footer]} site={site} />}
    </>
  );

  if (!isClient || loading) {
    return (
      <Chrome>
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      </Chrome>
    );
  }

  if (error) {
    return (
      <Chrome>
        <PortalBrandRoot site={site} className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-danger mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="primary" onClick={fetchBookingDetail}>Try again</Button>
            <Button variant="ghost" onClick={handleBack}>Go back</Button>
          </div>
        </PortalBrandRoot>
      </Chrome>
    );
  }

  if (!booking) return null;

  const st = statusMeta(booking.status);
  const pay = paymentMeta(booking);
  const online = isOnline(booking);
  const isTerminal = ["cancelled", "refunded"].includes(booking.status);
  const canCancel = ["paid", "scheduled"].includes(booking.status);
  const canReview = booking.status === "completed" && !booking.has_review;
  const hide = (name) => (tab !== name ? "max-lg:hidden" : "");

  const callAuth = resolveToken(tenantId);
  const rawToken = (callAuth.token || "").replace(/^Bearer /, "");

  const Section = ({ icon: Icon, title, children, className = "" }) => (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
  const Row = ({ label, children, tone }) => (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-end tabular-nums ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-foreground"}`}>{children}</span>
    </div>
  );

  return (
    <Chrome>
      <PortalBrandRoot site={site} className="max-w-5xl mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={handleBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to my bookings
        </button>

        {/* Header */}
        <header className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{booking.service_name || "Service"}</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">#{booking.booking_number}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusPill tone={st.tone} size="md" label={st.label} />
              <Badge variant={pay.tone}>{pay.label}</Badge>
            </div>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="lg:hidden mb-4">
          <Tabs value={tab} onChange={setTab} variant="segment" className="w-full" items={[
            { value: "details", label: "Details", icon: Info },
            { value: "chat", label: "Chat", icon: MessageSquare },
          ]} />
        </div>

        {/* Workspace */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 lg:items-start">
          {/* LEFT — details */}
          <div className={`space-y-4 min-w-0 ${hide("details")}`}>
            {/* Scheduling + location */}
            {(booking.scheduled_date || booking.scheduled_datetime || online || booking.meeting_url) && (
              <Section icon={Calendar} title="Date, time & location">
                {(booking.scheduled_date || booking.scheduled_datetime) && (
                  <p className="text-base font-semibold text-foreground">
                    {formatDateTime(booking.scheduled_date || booking.scheduled_datetime, booking.scheduled_time, booking.timezone)}
                  </p>
                )}
                {booking.duration_minutes ? (
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{booking.duration_minutes} minutes</p>
                ) : null}
                <div className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
                  {online ? <Video className="w-4 h-4 text-muted-foreground" /> : <MapPin className="w-4 h-4 text-muted-foreground" />}
                  {booking.meeting_url ? (
                    <a href={booking.meeting_url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                      {booking.meeting_provider ? `Join via ${booking.meeting_provider.replace(/_/g, " ")}` : "Join meeting"}<ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span>{online ? "Online meeting" : (booking.location || "In person")}</span>
                  )}
                </div>
              </Section>
            )}

            {/* Provider */}
            {booking.provider_name && (
              <Section icon={User} title="Your provider">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {(booking.provider_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <p className="text-sm font-medium text-foreground">{booking.provider_name}</p>
                </div>
              </Section>
            )}

            {/* Payment */}
            <Section icon={CreditCard} title="Payment">
              <Row label="Total">{formatMoney(booking.total_amount, booking.currency)}</Row>
              <Row label="Amount paid" tone="success">{formatMoney(booking.amount_paid, booking.currency)}</Row>
              {booking.amount_remaining > 0 && <Row label="Remaining" tone="danger">{formatMoney(booking.amount_remaining, booking.currency)}</Row>}
            </Section>

            {/* Notes */}
            {booking.customer_notes && (
              <Section icon={Info} title="Your notes">
                <p className="text-sm text-foreground whitespace-pre-wrap">{booking.customer_notes}</p>
              </Section>
            )}

            {/* Requirements */}
            {booking.requirements && Object.keys(booking.requirements).length > 0 && (
              <Section icon={ListChecks} title="Requirements">
                <div className="space-y-1.5 text-sm">
                  {Object.entries(booking.requirements).map(([key, value]) => (
                    <div key={key}><span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span><span className="text-foreground">{Array.isArray(value) ? value.join(", ") : String(value)}</span></div>
                  ))}
                </div>
              </Section>
            )}

            {/* Activity */}
            <Section icon={Clock} title="Activity">
              <Row label="Created">{formatDate(booking.created_at)}</Row>
              {booking.confirmed_at && <Row label="Confirmed">{formatDate(booking.confirmed_at)}</Row>}
              {booking.completed_at && <Row label="Completed">{formatDate(booking.completed_at)}</Row>}
              {booking.cancelled_at && <Row label="Cancelled" tone="danger">{formatDate(booking.cancelled_at)}</Row>}
              {booking.cancelled_reason && (
                <p className="mt-2 text-xs text-danger-soft-foreground bg-danger-soft rounded-lg p-2">Reason: {booking.cancelled_reason}</p>
              )}
            </Section>

            {/* Actions */}
            {(canCancel || canReview || booking.meeting_url) && (
              <div className="flex flex-wrap gap-2">
                {booking.meeting_url && (
                  <Button as="a" href={booking.meeting_url} target="_blank" rel="noopener noreferrer" variant="success" leftIcon={<Video className="w-4 h-4" />}>
                    Join meeting
                  </Button>
                )}
                {canReview && (
                  <Button variant="secondary" onClick={() => setReviewOpen(true)} leftIcon={<Star className="w-4 h-4" />}>
                    Leave a review
                  </Button>
                )}
                {canCancel && (
                  <Button variant="secondary" onClick={handleCancelBooking} loading={cancelling} leftIcon={<XCircle className="w-4 h-4" />} className="text-danger border-danger/30 hover:bg-danger-soft">
                    Cancel booking
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — chat + call */}
          <div className={`space-y-3 ${hide("chat")}`}>
            {isClient && (
              <CallDock
                subjectType="booking"
                subjectId={bookingId}
                tenantId={tenantId}
                authMode="guest"
                guestToken={rawToken}
                selfName={booking.customer_name || "You"}
                canStart={["paid", "scheduled"].includes(booking.status)}
              />
            )}
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[68vh] lg:h-[72vh]">
              <div className="flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground leading-tight">Messages</h2>
                  <p className="text-[11px] text-muted-foreground leading-tight">Chat with the team &amp; share files</p>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {guestToken && (
                  <BookingConversationPanel
                    bookingId={bookingId}
                    domain={domain}
                    auth={{ guestToken }}
                    viewer="customer"
                    fill
                    showComposer={!isTerminal}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </PortalBrandRoot>

      {/* Review modal */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Leave a review" description="How was your experience?" size="md">
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
              <Star className={`w-8 h-8 ${n <= reviewRating ? "text-warning fill-warning" : "text-border"}`} />
            </button>
          ))}
        </div>
        <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} placeholder="Share a few words about your experience (optional)" />
        <ModalFooter>
          <Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submitReview} loading={reviewSubmitting}>Submit review</Button>
        </ModalFooter>
      </Modal>
    </Chrome>
  );
}
