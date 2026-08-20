"use client";

/**
 * CustomerRequestsDashboard — customer portal "My Requests".
 *
 * Auth / token / OTP logic is UNCHANGED — only the presentation was rebuilt
 * as a premium, tenant-branded, mobile-first portal that matches the
 * customer Bookings and Orders pages (Phases 7 & 8).
 *   - Authenticated user → Authorization: Bearer (JWT cookie access_token)
 *   - Guest → email → OTP → signed token via X-Request-Token header
 *   - Token storage keyed by tenantId (customer_request_token_{tenantId})
 *
 * Multilingual labels (en / ar / ur) and RTL are preserved from the tenant
 * language context.
 */

import { useState, useEffect, useCallback } from "react";
import {
  LogOut, RefreshCw, Mail, ArrowRight, MessageSquare, ClipboardList,
  FileText, Handshake, CheckCircle2, PackageCheck, CalendarDays,
} from "lucide-react";

import PortalBrandRoot, { getTenantBrand } from "../components/portalBrand";
import { initials } from "../components/portalPresentation";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantSite } from "../[domain]/TenantClientWrapper";
import { tenantRoutes } from "@/lib/tenantRoutes";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Status → semantic badge + multilingual label (visual language matches
//     Bookings / Orders soft badges; strings preserved for ar / ur). ───
const STATUS_META = {
  pending:     { variant: "soft-warning", label: { en: "Pending", ar: "قيد الانتظار", ur: "زیر التواء" } },
  negotiating: { variant: "soft-info",    label: { en: "Negotiating", ar: "قيد التفاوض", ur: "گفت و شنید" } },
  accepted:    { variant: "soft-success", label: { en: "Accepted", ar: "مقبول", ur: "قبول شدہ" } },
  converted:   { variant: "soft-brand",   label: { en: "Converted", ar: "محول", ur: "تبدیل شدہ" } },
  completed:   { variant: "soft-success", label: { en: "Completed", ar: "مكتمل", ur: "مکمل" } },
  rejected:    { variant: "soft-danger",  label: { en: "Rejected", ar: "مرفوض", ur: "مسترد" } },
  cancelled:   { variant: "neutral",      label: { en: "Cancelled", ar: "ملغي", ur: "منسوخ" } },
};

function statusMeta(status) {
  return STATUS_META[status] || { variant: "neutral", label: { en: (status || "unknown").replace(/_/g, " ") } };
}

// Summary buckets for the requests portal.
const SUMMARY = [
  { key: "pending",     icon: FileText,     chip: "bg-warning-soft text-warning-soft-foreground", label: { en: "Awaiting reply", ar: "بانتظار الرد", ur: "جواب کے منتظر" }, match: (r) => r.status === "pending" },
  { key: "negotiating", icon: Handshake,    chip: "bg-info-soft text-info-soft-foreground",       label: { en: "In discussion", ar: "قيد النقاش", ur: "زیرِ بحث" },       match: (r) => r.status === "negotiating" },
  { key: "accepted",    icon: CheckCircle2, chip: "bg-success-soft text-success-soft-foreground",  label: { en: "Accepted", ar: "مقبول", ur: "قبول شدہ" },                match: (r) => r.status === "accepted" },
  { key: "converted",   icon: PackageCheck, chip: "bg-accent text-accent-foreground",              label: { en: "Converted", ar: "محول", ur: "تبدیل شدہ" },               match: (r) => r.status === "converted" || r.status === "completed" },
];

// ─── API + token helpers (UNCHANGED behaviour) ───

function apiHeaders(tenantRef, token, isGuestToken) {
  const h = { "Content-Type": "application/json" };
  // tenantRef: UUID when known (most reliable), slug otherwise.
  if (tenantRef) h["X-Tenant"] = tenantRef;
  if (token) {
    h[isGuestToken ? "X-Request-Token" : "Authorization"] = isGuestToken ? token : `Bearer ${token}`;
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

function tokenKey(tenantId) { return `customer_request_token_${tenantId}`; }
function emailStoreKey(tenantId) { return `customer_request_email_${tenantId}`; }

function findStoredGuestToken(tenantId) {
  try {
    if (tenantId) {
      const token = localStorage.getItem(tokenKey(tenantId));
      const email = localStorage.getItem(emailStoreKey(tenantId));
      if (token) return { token, email: email || "", tenantId };
    }
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("customer_request_token_")) {
        const token = localStorage.getItem(key);
        if (token) {
          const storedTenantId = key.replace("customer_request_token_", "");
          const email = localStorage.getItem(`customer_request_email_${storedTenantId}`) || "";
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

const LOCALE = { en: "en-US", ar: "ar", ur: "ur" };

function fmtDate(s, language) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString(LOCALE[language] || "en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d.toLocaleDateString();
  }
}

function unreadOf(r) {
  return r.unread_count ?? r.unread_messages_count ?? (r.has_unread ? 1 : 0) ?? 0;
}

// ─── Branded chrome (shared visual language with Bookings / Orders) ───

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

function AuthShell({ site, brand, isRTL, children }) {
  return (
    <PortalBrandRoot site={site} dir={isRTL ? "rtl" : "ltr"} className="min-h-[70vh] flex items-center justify-center px-4 py-12">
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

export default function CustomerRequestsDashboard({ data, settings, tenantId, domain, site }) {
  const { language, isRTL } = useTenantLang();
  const { currency } = useTenantSite();
  const brand = getTenantBrand(site);
  const t = (obj) => obj?.[language] || obj?.en || "";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const [authMode, setAuthMode] = useState(null); // null (checking) | guest_login | authenticated
  const [guestEmail, setGuestEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let token = null;
    try { token = document.cookie.match(/access_token=([^;]+)/)?.[1]; } catch {}
    if (token) {
      setAuthToken(token);
      setIsGuestToken(false);
      setAuthMode("authenticated");
      return;
    }
    const stored = findStoredGuestToken(tenantId);
    if (stored) {
      setAuthToken(stored.token);
      setIsGuestToken(true);
      setGuestEmail(stored.email);
      setAuthMode("authenticated");
      return;
    }
    setAuthMode("guest_login");
    setLoading(false);
  }, [tenantId]);

  const fetchRequests = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      const result = await apiCall(
        `${API_BASE}/api/v1/custom-requests/?${params}`,
        { headers: apiHeaders(tenantId || domain, authToken, isGuestToken) }
      );
      setRequests(result.results || result || []);
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        setAuthMode("guest_login");
        setAuthToken(null);
      } else {
        setError("Failed to load requests");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, isGuestToken, domain, filter]);

  useEffect(() => {
    if (authMode === "authenticated" && authToken) fetchRequests();
  }, [authMode, authToken, fetchRequests]);

  const handleSendOtp = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await apiCall(`${API_BASE}/api/v1/custom-requests/request-access/`, {
        method: "POST",
        headers: apiHeaders(tenantId || domain),
        body: JSON.stringify({ email: guestEmail }),
      });
      setOtpSent(true);
    } catch (err) {
      setAuthError(err.status === 429
        ? t({ en: "Code already sent. Please wait a moment.", ar: "تم إرسال الرمز. يرجى الانتظار.", ur: "کوڈ بھیجا جا چکا ہے۔ براہ کرم انتظار کریں۔" })
        : t({ en: "Failed to send verification code", ar: "فشل إرسال رمز التحقق", ur: "تصدیقی کوڈ بھیجنے میں ناکام" }));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await apiCall(`${API_BASE}/api/v1/custom-requests/verify-access/`, {
        method: "POST",
        headers: apiHeaders(tenantId || domain),
        body: JSON.stringify({ email: guestEmail, code: otp }),
      });
      const token = result.token;
      setAuthToken(token);
      setIsGuestToken(true);
      setAuthMode("authenticated");
      try {
        localStorage.setItem(tokenKey(tenantId), token);
        localStorage.setItem(emailStoreKey(tenantId), guestEmail);
      } catch {}
    } catch {
      setAuthError(t({ en: "Invalid verification code", ar: "رمز التحقق غير صحيح", ur: "غلط تصدیقی کوڈ" }));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredGuestToken(tenantId);
    setAuthToken(null);
    setIsGuestToken(false);
    setRequests([]);
    setGuestEmail("");
    setOtp("");
    setOtpSent(false);
    setAuthMode("guest_login");
  };

  // ── guest login (email → OTP) ──
  if (authMode === "guest_login") {
    return (
      <AuthShell site={site} brand={brand} isRTL={isRTL}>
        {!otpSent ? (
          <>
            <h2 className="text-lg font-bold text-foreground">{t({ en: "Track your requests", ar: "تتبع طلباتك", ur: "اپنی درخواستیں ٹریک کریں" })}</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-5">{t({ en: "Enter your email to view your custom service requests.", ar: "أدخل بريدك الإلكتروني لعرض طلبات الخدمة المخصصة.", ur: "اپنی حسب ضرورت خدمت کی درخواستیں دیکھنے کے لیے اپنا ای میل درج کریں۔" })}</p>
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-3">
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder={t({ en: "your@email.com", ar: "بريدك الإلكتروني", ur: "آپ کا ای میل" })}
                  required inputMode="email"
                  className="w-full h-11 bg-input-background border border-border rounded-xl ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
                />
              </div>
              {authError && <p className="text-sm text-danger">{authError}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={authLoading} disabled={!guestEmail}>
                {t({ en: "Send verification code", ar: "إرسال رمز التحقق", ur: "تصدیقی کوڈ بھیجیں" })}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground">{t({ en: "Enter verification code", ar: "أدخل رمز التحقق", ur: "تصدیقی کوڈ درج کریں" })}</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              {t({ en: "We sent a code to", ar: "أرسلنا رمزًا إلى", ur: "ہم نے کوڈ بھیجا ہے" })} <strong className="text-foreground">{guestEmail}</strong>
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-3">
              <input
                type="text" inputMode="numeric" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" maxLength={6} required
                className="w-full h-14 bg-input-background border border-border rounded-xl px-3 text-center text-2xl tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              />
              {authError && <p className="text-sm text-danger">{authError}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={authLoading} disabled={otp.length < 4}>
                {t({ en: "Verify & view requests", ar: "تحقق وعرض الطلبات", ur: "تصدیق کریں اور دیکھیں" })}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button onClick={() => { setOtpSent(false); setOtp(""); setAuthError(""); }} className="text-muted-foreground hover:text-foreground">
                {t({ en: "Use different email", ar: "استخدم بريدًا آخر", ur: "دوسرا ای میل" })}
              </button>
              <button onClick={handleSendOtp} disabled={authLoading} className="text-primary hover:underline font-medium">
                {t({ en: "Resend code", ar: "إعادة إرسال", ur: "دوبارہ بھیجیں" })}
              </button>
            </div>
          </>
        )}
      </AuthShell>
    );
  }

  // ── checking ──
  if (authMode === null) {
    return <PortalBrandRoot site={site} className="flex justify-center py-20"><Spinner size="lg" /></PortalBrandRoot>;
  }

  const filtered = requests;
  const statusTabs = ["all", "pending", "negotiating", "accepted", "converted"];

  return (
    <PortalBrandRoot site={site} dir={isRTL ? "rtl" : "ltr"} className="max-w-4xl mx-auto px-4 py-8">
      <PortalHeader
        brand={brand}
        title={t({ en: "My Requests", ar: "طلباتي", ur: "میری درخواستیں" })}
        subtitle={isGuestToken ? guestEmail : undefined}
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={fetchRequests} leftIcon={<RefreshCw className="w-4 h-4" />} className="max-sm:px-2">
              <span className="hidden sm:inline">{t({ en: "Refresh", ar: "تحديث", ur: "ریفریش" })}</span>
            </Button>
            {isGuestToken && (
              <Button variant="ghost" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />} className="max-sm:px-2">
                <span className="hidden sm:inline">{t({ en: "Sign out", ar: "خروج", ur: "سائن آؤٹ" })}</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {SUMMARY.map((c) => {
          const Icon = c.icon;
          const value = requests.reduce((n, r) => (c.match(r) ? n + 1 : n), 0);
          return (
            <div key={c.key} className="rounded-xl border border-border bg-card p-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.chip}`}><Icon className="w-4 h-4" strokeWidth={2} /></div>
              <p className="text-xl font-bold text-foreground tabular-nums mt-2">{value}</p>
              <p className="text-xs text-muted-foreground truncate">{t(c.label)}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-danger mb-3">{error}</p>
          <Button variant="primary" onClick={fetchRequests}>{t({ en: "Try again", ar: "أعد المحاولة", ur: "دوبارہ کوشش کریں" })}</Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            {statusTabs.map((tab) => (
              <FilterPill
                key={tab}
                active={filter === tab}
                onClick={() => setFilter(tab)}
                label={tab === "all" ? t({ en: "All", ar: "الكل", ur: "سب" }) : t(statusMeta(tab).label)}
              />
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3"><ClipboardList className="w-6 h-6" /></div>
              <p className="text-base font-semibold text-foreground">{t({ en: "No requests found", ar: "لا توجد طلبات", ur: "کوئی درخواست نہیں ملی" })}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter !== "all"
                  ? t({ en: "Try a different filter.", ar: "جرّب تصفية مختلفة.", ur: "مختلف فلٹر آزمائیں۔" })
                  : t({ en: "Your custom service requests will appear here.", ar: "ستظهر طلبات الخدمة المخصصة هنا.", ur: "آپ کی حسب ضرورت خدمت کی درخواستیں یہاں ظاہر ہوں گی۔" })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  t={t}
                  language={language}
                  currency={currency}
                  onOpen={() => { window.location.href = tenantRoutes.myRequest(req.id); }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </PortalBrandRoot>
  );
}

function FilterPill({ active, onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium whitespace-nowrap transition ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
      {label}
    </button>
  );
}

function RequestCard({ req, t, language, currency, onOpen }) {
  const meta = statusMeta(req.status);
  const unread = unreadOf(req);
  const created = fmtDate(req.created_at, language);
  const activity = fmtDate(req.updated_at || req.created_at, language);

  return (
    <button type="button" onClick={onOpen}
      className="w-full text-start rounded-xl border border-border bg-card p-4 hover:shadow-sm active:bg-muted/40 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">{req.title}</span>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">{unread > 9 ? "9+" : unread}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">#{req.request_number}</p>
        </div>
        <Badge variant={meta.variant}>{t(meta.label)}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
        {created && (
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span className="truncate">{t({ en: "Created", ar: "أنشئ", ur: "بنایا گیا" })} {created}</span>
          </div>
        )}
        {activity && (
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate">{t({ en: "Updated", ar: "آخر تحديث", ur: "اپ ڈیٹ" })} {activity}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {req.budget_max ? (
            <span className="text-sm font-semibold text-foreground tabular-nums truncate">
              {t({ en: "Budget", ar: "الميزانية", ur: "بجٹ" })}: {currency || "SAR"} {req.budget_max}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground truncate">
              {unread > 0
                ? t({ en: "New messages", ar: "رسائل جديدة", ur: "نئے پیغامات" })
                : t({ en: "Custom request", ar: "طلب مخصص", ur: "حسب ضرورت درخواست" })}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-primary shrink-0">
          {t({ en: "Open", ar: "فتح", ur: "کھولیں" })} <ArrowRight className={`w-4 h-4 ${language && ["ar", "ur"].includes(language) ? "rotate-180" : ""}`} />
        </span>
      </div>
    </button>
  );
}
