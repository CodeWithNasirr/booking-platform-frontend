// src/app/tenant-site/modules/CustomerOrdersDashboard.js
"use client";

/**
 * CustomerOrdersDashboard — customer portal "My Orders".
 *
 * Auth/token/OTP logic is UNCHANGED — only the presentation was rebuilt
 * as a premium, tenant-branded, mobile-first portal (matches My Bookings).
 *   - Authenticated user → Authorization: Bearer (JWT)
 *   - Guest → email → OTP → signed token via X-Order-Token header
 *   - Token storage keyed by tenantId
 */

import { useState, useEffect, useCallback } from "react";
import {
  LogOut, RefreshCw, Mail, ArrowRight, User, MessageSquare, PackageOpen,
  Wallet, Loader2, PackageCheck, CheckCircle2, ClipboardList,
} from "lucide-react";

import PortalBrandRoot, { getTenantBrand } from "../components/portalBrand";
import { initials } from "../components/portalPresentation";
import {
  OrderStatusBadge, ORDER_STATUS_LABEL,
} from "@/components/orders";
import { getPaymentState, makeFormatters, lastActivity } from "@/app/dashboard/orders/components/orderPresentation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── API + token helpers (unchanged) ───

function apiHeaders(domain, token, isGuestToken) {
  const h = { "Content-Type": "application/json" };
  if (domain) h["X-Tenant"] = domain;
  if (token) {
    if (isGuestToken) h["X-Order-Token"] = token;
    else h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

async function apiCall(url, opts = {}) {
  const res = await fetch(url, { ...opts, credentials: "include" });
  if (!res.ok) {
    const err = new Error(`${res.status}`);
    err.status = res.status;
    try { err.data = await res.json(); } catch {}
    throw err;
  }
  return res.json();
}

function tokenKey(tenantId) { return `customer_order_token_${tenantId}`; }
function emailStoreKey(tenantId) { return `customer_order_email_${tenantId}`; }

function findStoredGuestToken(tenantId) {
  try {
    if (tenantId) {
      const token = localStorage.getItem(tokenKey(tenantId));
      const email = localStorage.getItem(emailStoreKey(tenantId));
      if (token) return { token, email: email || "", tenantId };
    }
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("customer_order_token_")) {
        const token = localStorage.getItem(key);
        if (token) {
          const storedTenantId = key.replace("customer_order_token_", "");
          const email = localStorage.getItem(`customer_order_email_${storedTenantId}`) || "";
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

// ─── Summary buckets ───
const SUMMARY = [
  { key: "active", label: "Upcoming / active", icon: Loader2, chip: "bg-accent text-accent-foreground", match: (o) => ["paid", "accepted", "pending_assignment"].includes(o.status) },
  { key: "awaiting", label: "Awaiting payment", icon: Wallet, chip: "bg-warning-soft text-warning-soft-foreground", match: (o) => o.status === "pending_payment" },
  { key: "progress", label: "In progress", icon: ClipboardList, chip: "bg-info-soft text-info-soft-foreground", match: (o) => o.status === "in_progress" },
  { key: "delivered", label: "Delivered", icon: PackageCheck, chip: "bg-info-soft text-info-soft-foreground", match: (o) => o.status === "delivered" },
  { key: "completed", label: "Completed", icon: CheckCircle2, chip: "bg-success-soft text-success-soft-foreground", match: (o) => o.status === "completed" },
];

// ─── Branded chrome ───
function PortalHeader({ brand, title, subtitle, actions }) {
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt={brand.name || "Logo"} className="h-9 w-9 rounded-xl object-cover shrink-0" />
        ) : brand.name ? (
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">{initials(brand.name)}</div>
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

function AuthShell({ brand, children }) {
  return (
    <PortalBrandRoot site={null} className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name || "Logo"} className="h-12 w-12 rounded-2xl object-cover mb-3" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-base font-bold mb-3">{initials(brand.name || "•")}</div>
          )}
          {brand.name && <p className="text-sm text-muted-foreground">{brand.name}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </PortalBrandRoot>
  );
}

// =========================================================================

export default function CustomerOrdersDashboard({ domain, tenantId: tenantIdProp, site, onSelectOrder, token: externalToken }) {
  const brand = getTenantBrand(site);

  const [authState, setAuthState] = useState("checking");
  const [accessToken, setAccessToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [resolvedTenantId, setResolvedTenantId] = useState(tenantIdProp || null);

  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (externalToken) {
      setAccessToken(externalToken);
      setIsGuestToken(false);
      setAuthState("authenticated");
      return;
    }
    const stored = findStoredGuestToken(tenantIdProp);
    if (stored) {
      setAccessToken(stored.token);
      setIsGuestToken(true);
      setCustomerEmail(stored.email);
      setResolvedTenantId(stored.tenantId);
      setAuthState("authenticated");
      return;
    }
    setAuthState("email");
  }, [tenantIdProp, externalToken]);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall(`${API_BASE}/api/v1/orders/my-orders/`, { headers: apiHeaders(domain, accessToken, isGuestToken) });
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        if (resolvedTenantId) {
          localStorage.removeItem(tokenKey(resolvedTenantId));
          localStorage.removeItem(emailStoreKey(resolvedTenantId));
        }
        setAccessToken(null);
        setIsGuestToken(false);
        setAuthState("email");
        return;
      }
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, isGuestToken, domain, resolvedTenantId]);

  useEffect(() => {
    if (authState === "authenticated") fetchOrders();
  }, [authState, fetchOrders]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    try {
      setOtpSending(true);
      setAuthError("");
      await apiCall(`${API_BASE}/api/v1/orders/request-access/`, {
        method: "POST", headers: apiHeaders(domain), body: JSON.stringify({ email: emailInput.trim() }),
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
      const data = await apiCall(`${API_BASE}/api/v1/orders/verify-access/`, {
        method: "POST", headers: apiHeaders(domain), body: JSON.stringify({ email: customerEmail, code: otpCode.trim() }),
      });
      const newToken = data.token;
      const newTenantId = data.tenant_id || resolvedTenantId;
      if (newTenantId) {
        try {
          localStorage.setItem(tokenKey(newTenantId), newToken);
          localStorage.setItem(emailStoreKey(newTenantId), customerEmail);
        } catch {}
        setResolvedTenantId(newTenantId);
      }
      setAccessToken(newToken);
      setIsGuestToken(true);
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
    setIsGuestToken(false);
    setOrders([]);
    setCustomerEmail("");
    setEmailInput("");
    setOtpCode("");
    setAuthState("email");
  };

  // ── checking ──
  if (authState === "checking") {
    return <PortalBrandRoot site={site} className="flex justify-center py-20"><Spinner size="lg" /></PortalBrandRoot>;
  }

  // ── email ──
  if (authState === "email") {
    return (
      <AuthShell brand={brand}>
        <h2 className="text-lg font-bold text-foreground">View your orders</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">Enter the email you used when placing your order.</p>
        <form onSubmit={handleRequestOTP} className="space-y-3">
          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="your@email.com" required inputMode="email"
              className="w-full h-11 bg-input-background border border-border rounded-xl ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring" />
          </div>
          {authError && <p className="text-sm text-danger">{authError}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={otpSending}>Send verification code</Button>
        </form>
      </AuthShell>
    );
  }

  // ── otp ──
  if (authState === "otp") {
    return (
      <AuthShell brand={brand}>
        <h2 className="text-lg font-bold text-foreground">Enter verification code</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">We sent a 6-digit code to <strong className="text-foreground">{customerEmail}</strong></p>
        <form onSubmit={handleVerifyOTP} className="space-y-3">
          <input type="text" inputMode="numeric" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} required
            className="w-full h-14 bg-input-background border border-border rounded-xl px-3 text-center text-2xl tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring" />
          {authError && <p className="text-sm text-danger">{authError}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={otpVerifying} disabled={otpCode.length < 6}>Verify &amp; view orders</Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={() => { setAuthState("email"); setAuthError(""); setOtpCode(""); }} className="text-muted-foreground hover:text-foreground">Use different email</button>
          <button onClick={handleRequestOTP} disabled={otpSending} className="text-primary hover:underline font-medium">Resend code</button>
        </div>
      </AuthShell>
    );
  }

  // ── dashboard ──
  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <PortalBrandRoot site={site} className="max-w-4xl mx-auto px-4 py-8">
      <PortalHeader
        brand={brand}
        title="My Orders"
        subtitle={customerEmail}
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={fetchOrders} leftIcon={<RefreshCw className="w-4 h-4" />} className="max-sm:px-2"><span className="hidden sm:inline">Refresh</span></Button>
            {isGuestToken && (
              <Button variant="ghost" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />} className="max-sm:px-2"><span className="hidden sm:inline">Sign out</span></Button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {SUMMARY.map((c) => {
          const Icon = c.icon;
          const value = orders.reduce((n, o) => (c.match(o) ? n + 1 : n), 0);
          return (
            <div key={c.key} className="rounded-xl border border-border bg-card p-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.chip}`}><Icon className="w-4 h-4" strokeWidth={2} /></div>
              <p className="text-xl font-bold text-foreground tabular-nums mt-2">{value}</p>
              <p className="text-xs text-muted-foreground truncate">{c.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-danger mb-3">{error}</p>
          <Button variant="primary" onClick={fetchOrders}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="All" count={orders.length} />
            {Object.entries(statusCounts).map(([s, count]) => (
              <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} label={ORDER_STATUS_LABEL[s] || s} count={count} />
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3"><PackageOpen className="w-6 h-6" /></div>
              <p className="text-base font-semibold text-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-1">{statusFilter !== "all" ? "Try a different filter." : "Your orders will appear here after you make a purchase."}</p>
            </div>
          ) : (
            <div className="space-y-3">{filtered.map((o) => <OrderCard key={o.id} order={o} onOpen={() => onSelectOrder?.(o.id)} />)}</div>
          )}
        </>
      )}
    </PortalBrandRoot>
  );
}

function FilterPill({ active, onClick, label, count }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium whitespace-nowrap transition ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
      {label}{typeof count === "number" && <span className={`text-[10px] font-semibold ${active ? "opacity-80" : ""}`}>{count}</span>}
    </button>
  );
}

function OrderCard({ order: o, onOpen }) {
  const { money } = makeFormatters(false, o.currency || "USD");
  const pay = getPaymentState(o, null);
  const unread = o.unread_count || 0;

  return (
    <button type="button" onClick={onOpen}
      className="w-full text-start rounded-xl border border-border bg-card p-4 hover:shadow-sm active:bg-muted/40 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">{o.service_name || "Service"}</span>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">{unread > 9 ? "9+" : unread}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">#{o.order_number}</p>
        </div>
        <OrderStatusBadge status={o.status} size="sm" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
        {o.provider_name && (
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <User className="w-4 h-4 shrink-0" /><span className="truncate text-foreground">{o.provider_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
          <MessageSquare className="w-4 h-4 shrink-0" /><span className="truncate">{lastActivity(o, false)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={pay.tone}>{pay.label}</Badge>
          <span className="text-sm font-semibold text-foreground tabular-nums">{money(o.total_amount)}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-primary">View order <ArrowRight className="w-4 h-4" /></span>
      </div>
    </button>
  );
}
