// src/app/tenant-site/modules/CustomerBookingsDashboard.js
"use client";

/**
 * CustomerBookingsDashboard — customer portal "My Bookings".
 *
 * Auth/token/OTP/magic-link logic is UNCHANGED — only the presentation
 * was rebuilt as a premium, tenant-branded, mobile-first portal on the
 * Phase-1 design system.
 *   - Authenticated user → fetch bookings with Bearer token
 *   - Guest → email → OTP → token via Authorization header
 *   - Token storage keyed by tenantId
 */

import { useState, useEffect, useCallback } from "react";
import { LogOut, RefreshCw, Search, Mail, ArrowRight, CalendarClock, User, MapPin, Video, MessageSquare, CalendarX } from "lucide-react";

import PortalBrandRoot, { getTenantBrand } from "../components/portalBrand";
import {
  statusMeta, paymentMeta, isOnline, unreadCount, fmtMoney, fmtDate, fmtTime, initials, SUMMARY_CARDS,
} from "../components/portalPresentation";
import StatusPill from "@/components/ui/StatusPill";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

// ─── API helpers (unchanged) ───

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function apiHeaders(domain, token) {
  const h = { "Content-Type": "application/json" };
  if (domain) h["X-Tenant"] = domain;
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiCall(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = new Error(`${res.status}`);
    err.status = res.status;
    try { err.data = await res.json(); } catch {}
    throw err;
  }
  return res.json();
}

// ─── Token storage: keyed by tenantId (unchanged) ───

function tokenKey(tenantId) { return `customer_booking_token_${tenantId}`; }
function emailStoreKey(tenantId) { return `customer_booking_email_${tenantId}`; }

function findStoredGuestToken(tenantId) {
  try {
    if (tenantId) {
      const token = localStorage.getItem(tokenKey(tenantId));
      const email = localStorage.getItem(emailStoreKey(tenantId));
      if (token) return { token, email: email || "", tenantId };
    }
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("customer_booking_token_")) {
        const token = localStorage.getItem(key);
        if (token) {
          const storedTenantId = key.replace("customer_booking_token_", "");
          const email = localStorage.getItem(`customer_booking_email_${storedTenantId}`) || "";
          return { token, email, tenantId: storedTenantId };
        }
      }
    }
  } catch {}
  return null;
}

function clearStoredGuestToken(tenantId) {
  try {
    if (tenantId) {
      localStorage.removeItem(tokenKey(tenantId));
      localStorage.removeItem(emailStoreKey(tenantId));
    }
  } catch {}
}

// ─── Branded portal chrome ───

function PortalHeader({ brand, title, subtitle, actions }) {
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt={brand.name || "Logo"} className="h-9 w-9 rounded-xl object-cover shrink-0" />
        ) : brand.name ? (
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {initials(brand.name)}
          </div>
        ) : null}
        <div className="min-w-0">
          {brand.name && <p className="text-xs text-muted-foreground truncate">{brand.name}</p>}
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
  );
}

// ─── Auth gate screen shell ───

function AuthShell({ brand, children }) {
  return (
    <PortalBrandRoot site={null} className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name || "Logo"} className="h-12 w-12 rounded-2xl object-cover mb-3" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-base font-bold mb-3">
              {initials(brand.name || "•")}
            </div>
          )}
          {brand.name && <p className="text-sm text-muted-foreground">{brand.name}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </PortalBrandRoot>
  );
}

// =========================================================================

export default function CustomerBookingsDashboard({ domain, tenantId: tenantIdProp, site, onSelectBooking }) {
  const brand = getTenantBrand(site);

  // ─── Auth state (unchanged) ───
  const [authState, setAuthState] = useState("checking");
  const [accessToken, setAccessToken] = useState(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [resolvedTenantId, setResolvedTenantId] = useState(tenantIdProp || null);

  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const stored = findStoredGuestToken(tenantIdProp);
    if (stored) {
      setAccessToken(stored.token);
      setCustomerEmail(stored.email);
      setResolvedTenantId(stored.tenantId);
      setAuthState("authenticated");
      return;
    }
    setAuthState("email");
  }, [tenantIdProp]);

  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall(`${API_BASE}/api/v1/guest-bookings/by-email/`, {
        headers: apiHeaders(domain, accessToken), credentials: "include",
      });
      setBookings(data.bookings || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        if (resolvedTenantId) {
          localStorage.removeItem(tokenKey(resolvedTenantId));
          localStorage.removeItem(emailStoreKey(resolvedTenantId));
        }
        setAccessToken(null);
        setAuthState("email");
        return;
      }
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, domain, resolvedTenantId]);

  useEffect(() => {
    if (authState === "authenticated") fetchBookings();
  }, [authState, fetchBookings]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    try {
      setOtpSending(true);
      setAuthError("");
      await apiCall(`${API_BASE}/api/v1/guest-bookings/otp/send/`, {
        method: "POST", headers: apiHeaders(domain),
        body: JSON.stringify({ email: emailInput.trim() }), credentials: "include",
      });
      setCustomerEmail(emailInput.trim());
      setAuthState("otp");
    } catch (err) {
      if (err.status === 429) setAuthError("Code already sent. Please wait before requesting again.");
      else setAuthError(err.data?.detail || "Failed to send verification code.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    try {
      setOtpVerifying(true);
      setAuthError("");
      const data = await apiCall(`${API_BASE}/api/v1/guest-bookings/otp/verify/`, {
        method: "POST", headers: apiHeaders(domain), credentials: "include",
        body: JSON.stringify({ email: customerEmail, otp: otpCode.trim() }),
      });
      const newToken = data.token;
      const newTenantId = data.tenant_id || resolvedTenantId || tenantIdProp;
      if (newTenantId) {
        try {
          localStorage.setItem(tokenKey(newTenantId), newToken);
          localStorage.setItem(emailStoreKey(newTenantId), customerEmail);
        } catch {}
        setResolvedTenantId(newTenantId);
      }
      setAccessToken(newToken);
      setAuthState("authenticated");
    } catch (err) {
      setAuthError(err.data?.detail || "Invalid code. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleLogout = () => {
    clearStoredGuestToken(resolvedTenantId);
    setAccessToken(null);
    setBookings([]);
    setCustomerEmail("");
    setEmailInput("");
    setOtpCode("");
    setAuthState("email");
  };

  // ── Render: checking ──
  if (authState === "checking") {
    return (
      <PortalBrandRoot site={site} className="flex justify-center py-20">
        <Spinner size="lg" />
      </PortalBrandRoot>
    );
  }

  // ── Render: email ──
  if (authState === "email") {
    return (
      <AuthShell brand={brand}>
        <h2 className="text-lg font-bold text-foreground">View your bookings</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">Enter the email you used when making your booking.</p>
        <form onSubmit={handleRequestOTP} className="space-y-3">
          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
              placeholder="your@email.com" required inputMode="email"
              className="w-full h-11 bg-input-background border border-border rounded-xl ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
            />
          </div>
          {authError && <p className="text-sm text-danger">{authError}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={otpSending}>
            Send verification code
          </Button>
        </form>
      </AuthShell>
    );
  }

  // ── Render: otp ──
  if (authState === "otp") {
    return (
      <AuthShell brand={brand}>
        <h2 className="text-lg font-bold text-foreground">Enter verification code</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">We sent a code to <strong className="text-foreground">{customerEmail}</strong></p>
        <form onSubmit={handleVerifyOTP} className="space-y-3">
          <input
            type="text" inputMode="numeric" value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000" maxLength={6} required
            className="w-full h-14 bg-input-background border border-border rounded-xl px-3 text-center text-2xl tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
          />
          {authError && <p className="text-sm text-danger">{authError}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={otpVerifying} disabled={otpCode.length < 6}>
            Verify &amp; view bookings
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={() => { setAuthState("email"); setAuthError(""); setOtpCode(""); }} className="text-muted-foreground hover:text-foreground">
            Use different email
          </button>
          <button onClick={handleRequestOTP} disabled={otpSending} className="text-primary hover:underline font-medium">
            Resend code
          </button>
        </div>
      </AuthShell>
    );
  }

  // ── Render: dashboard ──
  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);
  const statusCounts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  return (
    <PortalBrandRoot site={site} className="max-w-4xl mx-auto px-4 py-8">
      <PortalHeader
        brand={brand}
        title="My Bookings"
        subtitle={customerEmail}
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={fetchBookings} leftIcon={<RefreshCw className="w-4 h-4" />} className="max-sm:px-2">
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />} className="max-sm:px-2">
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {SUMMARY_CARDS.map((c) => {
          const Icon = c.icon;
          const value = bookings.reduce((n, b) => (c.match(b) ? n + 1 : n), 0);
          return (
            <div key={c.key} className="rounded-xl border border-border bg-card p-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.chip}`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-2">{value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-danger mb-3">{error}</p>
          <Button variant="primary" onClick={fetchBookings}>Try again</Button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="All" count={bookings.length} />
            {Object.entries(statusCounts).map(([s, count]) => (
              <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} label={statusMeta(s).label} count={count} />
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
                <CalendarX className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-foreground">No bookings found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter !== "all" ? "Try a different filter." : "Your bookings will appear here after you make a reservation."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((b) => <BookingCard key={b.id} booking={b} onOpen={() => onSelectBooking?.(b.id)} />)}
            </div>
          )}
        </>
      )}
    </PortalBrandRoot>
  );
}

function FilterPill({ active, onClick, label, count }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium whitespace-nowrap transition ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span className={`text-[10px] font-semibold ${active ? "opacity-80" : ""}`}>{count}</span>
      )}
    </button>
  );
}

function BookingCard({ booking: b, onOpen }) {
  const st = statusMeta(b.status);
  const pay = paymentMeta(b);
  const online = isOnline(b);
  const unread = unreadCount(b);
  const date = fmtDate(b.scheduled_date || b.scheduled_datetime || b.created_at);
  const time = fmtTime(b.scheduled_time);

  return (
    <button
      type="button" onClick={onOpen}
      className="w-full text-start rounded-xl border border-border bg-card p-4 hover:shadow-sm active:bg-muted/40 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">{b.service_name || "Service"}</span>
            {unread > 0 && <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">#{b.booking_number}</p>
        </div>
        <StatusPill tone={st.tone} size="sm" label={st.label} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
        {date && (
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span className="truncate text-foreground">{date}{time ? ` · ${time}` : ""}</span>
          </div>
        )}
        {b.provider_name && (
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate text-foreground">{b.provider_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
          {online ? <Video className="w-4 h-4 shrink-0" /> : <MapPin className="w-4 h-4 shrink-0" />}
          <span className="truncate">{online ? "Online" : "In person"}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={pay.tone}>{pay.label}</Badge>
          <span className="text-sm font-semibold text-foreground tabular-nums">{fmtMoney(b.amount_paid ?? b.total_amount, b.currency)}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-primary">
          View booking <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </span>
      </div>
    </button>
  );
}
