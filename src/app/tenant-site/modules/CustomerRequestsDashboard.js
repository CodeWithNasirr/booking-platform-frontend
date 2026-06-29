"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { useTenantSite } from "../[domain]/TenantClientWrapper";
import { tenantRoutes } from "@/lib/tenantRoutes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_CONFIG = {
  pending: { label: { en: "Pending", ar: "قيد الانتظار", ur: "زیر التواء" }, color: "bg-yellow-100 text-yellow-800" },
  negotiating: { label: { en: "Negotiating", ar: "قيد التفاوض", ur: "گفت و شنید" }, color: "bg-blue-100 text-blue-800" },
  accepted: { label: { en: "Accepted", ar: "مقبول", ur: "قبول شدہ" }, color: "bg-green-100 text-green-800" },
  rejected: { label: { en: "Rejected", ar: "مرفوض", ur: "مسترد" }, color: "bg-red-100 text-red-800" },
  converted: { label: { en: "Converted", ar: "محول", ur: "تبدیل شدہ" }, color: "bg-purple-100 text-purple-800" },
  cancelled: { label: { en: "Cancelled", ar: "ملغي", ur: "منسوخ" }, color: "bg-gray-100 text-gray-800" },
};

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

function findStoredGuestToken(tenantId) {
  try {
    if (tenantId) {
      const token = localStorage.getItem(`customer_request_token_${tenantId}`);
      const email = localStorage.getItem(`customer_request_email_${tenantId}`);
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

export default function CustomerRequestsDashboard({ data, settings, tenantId, domain }) {
  const { language, isRTL } = useTenantLang();
  const { theme } = useTenantTheme();
  const { currency } = useTenantSite();
  const primaryColor = theme?.primary_color || "#3B82F6";
  console.log(tenantId,"tenantId")

  const t = (obj) => obj?.[language] || obj?.en || "";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");

  const [authMode, setAuthMode] = useState(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

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
  }, [authToken, isGuestToken, domain, filter]);

  useEffect(() => {
    if (authMode === "authenticated" && authToken) fetchRequests();
  }, [authMode, authToken, fetchRequests]);

  const handleSendOtp = async () => {
    setAuthLoading(true);
    try {
      await apiCall(`${API_BASE}/api/v1/custom-requests/request-access/`, {
        method: "POST",
        headers: apiHeaders(tenantId || domain),
        body: JSON.stringify({ email: guestEmail }),
      });
      setOtpSent(true);
    } catch {
      setError("Failed to send verification code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthLoading(true);
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
        localStorage.setItem(`customer_request_token_${tenantId}`, token);
        localStorage.setItem(`customer_request_email_${tenantId}`, guestEmail);
      } catch {}
    } catch {
      setError("Invalid verification code");
    } finally {
      setAuthLoading(false);
    }
  };

  if (authMode === "guest_login") {
    return (
      <div className="max-w-md mx-auto py-12 px-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
            <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t({ en: "Track Your Requests", ar: "تتبع طلباتك", ur: "اپنی درخواستیں ٹریک کریں" })}</h2>
          <p className="text-gray-600 text-sm mb-6">{t({ en: "Enter your email to view your custom service requests.", ar: "أدخل بريدك الإلكتروني لعرض طلبات الخدمة المخصصة.", ur: "اپنی حسب ضرورت خدمت کی درخواستیں دیکھنے کے لیے اپنا ای میل درج کریں۔" })}</p>

          {!otpSent ? (
            <div className="space-y-3">
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder={t({ en: "Your email address", ar: "بريدك الإلكتروني", ur: "آپ کا ای میل ایڈریس" })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": primaryColor }}
              />
              <button
                onClick={handleSendOtp}
                disabled={!guestEmail || authLoading}
                className="w-full py-3 text-white rounded-xl font-medium disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {authLoading ? "..." : t({ en: "Send Verification Code", ar: "إرسال رمز التحقق", ur: "تصدیقی کوڈ بھیجیں" })}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{t({ en: "Enter the code sent to", ar: "أدخل الرمز المرسل إلى", ur: "بھیجا گیا کوڈ درج کریں" })} {guestEmail}</p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full border rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": primaryColor }}
                maxLength={6}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 4 || authLoading}
                className="w-full py-3 text-white rounded-xl font-medium disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {authLoading ? "..." : t({ en: "Verify & View Requests", ar: "تحقق وعرض الطلبات", ur: "تصدیق کریں اور درخواستیں دیکھیں" })}
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filteredRequests = requests;
  const statusTabs = ["all", "pending", "negotiating", "accepted", "converted"];

  if (selectedRequest) {
    const req = selectedRequest;
    const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    return (
      <div className="max-w-3xl mx-auto py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
        <button
          onClick={() => setSelectedRequest(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
          {t({ en: "Back to requests", ar: "العودة إلى الطلبات", ur: "درخواستوں پر واپس" })}
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">{req.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                {t(statusConf.label)}
              </span>
            </div>
            <p className="text-sm text-gray-500">#{req.request_number}</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t({ en: "Description", ar: "الوصف", ur: "تفصیل" })}</h4>
              <p className="text-gray-800">{req.description}</p>
            </div>

            {(req.budget_min || req.budget_max) && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">{t({ en: "Budget", ar: "الميزانية", ur: "بجٹ" })}</h4>
                <p className="text-gray-800">
                  {req.budget_min && `${currency || "SAR"} ${req.budget_min}`}
                  {req.budget_min && req.budget_max && " – "}
                  {req.budget_max && `${currency || "SAR"} ${req.budget_max}`}
                </p>
              </div>
            )}

            {req.deadline && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">{t({ en: "Deadline", ar: "الموعد النهائي", ur: "ڈیڈ لائن" })}</h4>
                <p className="text-gray-800">{new Date(req.deadline).toLocaleDateString()}</p>
              </div>
            )}

            {req.quotes && req.quotes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">{t({ en: "Quotes", ar: "عروض الأسعار", ur: "کوٹس" })}</h4>
                <div className="space-y-3">
                  {req.quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg" style={{ color: primaryColor }}>
                          {quote.currency || currency || "SAR"} {quote.price}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          quote.status === "accepted" ? "bg-green-100 text-green-700" :
                          quote.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      {quote.message && <p className="text-sm text-gray-600 mb-2">{quote.message}</p>}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{t({ en: "Delivery:", ar: "التسليم:", ur: "ڈیلیوری:" })} {quote.delivery_days} {t({ en: "days", ar: "أيام", ur: "دن" })}</span>
                        {quote.revisions > 0 && <span>{quote.revisions} {t({ en: "revisions", ar: "تعديلات", ur: "ترامیم" })}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">{t({ en: "My Requests", ar: "طلباتي", ur: "میری درخواستیں" })}</h2>
        <span className="text-sm text-gray-500">{filteredRequests.length} {t({ en: "requests", ar: "طلبات", ur: "درخواستیں" })}</span>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === tab ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filter === tab ? { backgroundColor: primaryColor } : {}}
          >
            {tab === "all" ? t({ en: "All", ar: "الكل", ur: "سب" }) : t(STATUS_CONFIG[tab]?.label || {})}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">{t({ en: "No requests found", ar: "لا توجد طلبات", ur: "کوئی درخواست نہیں ملی" })}</h3>
          <p className="text-gray-500 text-sm">{t({ en: "Your custom service requests will appear here.", ar: "ستظهر طلبات الخدمة المخصصة هنا.", ur: "آپ کی حسب ضرورت خدمت کی درخواستیں یہاں ظاہر ہوں گی۔" })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <button
                key={req.id}
                onClick={() => { window.location.href = tenantRoutes.myRequest(req.id); }}
                className="w-full bg-white rounded-2xl shadow-sm border hover:shadow-md transition p-5 text-left"
              >
                <div className={`flex items-start justify-between gap-4 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">#{req.request_number}</p>
                    {req.budget_max && (
                      <p className="text-sm mt-1" style={{ color: primaryColor }}>
                        {t({ en: "Budget:", ar: "الميزانية:", ur: "بجٹ:" })} {currency || "SAR"} {req.budget_max}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                      {t(statusConf.label)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
