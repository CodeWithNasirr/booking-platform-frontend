// src/app/tenant-site/modules/CustomerBookingsDashboard.js
"use client";

/**
 * CustomerBookingsDashboard — Module with Self-Contained Auth
 *
 * Renders inside LayoutRenderer as a module.
 * Handles its own customer access:
 *   - Authenticated user → fetch bookings with Bearer token
 *   - Guest → email → OTP → token via Authorization header
 *
 * Refinements:
 *   - Token storage keyed by tenantId
 *   - Guest uses Authorization: Bearer header
 *   - Auto-login if token exists
 */

import { useState, useEffect, useCallback } from "react";

// ─── API helpers ───

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function apiHeaders(domain, token) {
  const h = { "Content-Type": "application/json" };
  if (domain) h["X-Tenant"] = domain;

  if (token) {
    h["Authorization"] = `Bearer ${token}`;
  }

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

// ─── Token storage: keyed by tenantId ───

function tokenKey(tenantId) {
  return `customer_booking_token_${tenantId}`;
}
function emailStoreKey(tenantId) {
  return `customer_booking_email_${tenantId}`;
}

/**
 * Find any stored guest token.
 * When tenantId is known, checks the exact key.
 * When tenantId is unknown, scans all keys.
 */
function findStoredGuestToken(tenantId) {
  try {
    // Exact match when tenantId known
    if (tenantId) {
      const token = localStorage.getItem(tokenKey(tenantId));
      const email = localStorage.getItem(emailStoreKey(tenantId));
      if (token) return { token, email: email || "", tenantId };
    }

    // Fallback: scan for any customer_booking_token_* key
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

// ─── Status config ───

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-purple-100 text-purple-800" },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100" };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function CustomerBookingsDashboard({
  domain,
  tenantId: tenantIdProp,
  onSelectBooking,
}) {
  // ─── Auth state ───
  const [authState, setAuthState] = useState("checking");
  const [accessToken, setAccessToken] = useState(null);
  const [customerEmail, setCustomerEmail] = useState("");
  // Resolved tenantId (from prop or from stored token)
  const [resolvedTenantId, setResolvedTenantId] = useState(tenantIdProp || null);

  // ─── OTP state ───
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  // ─── Bookings state ───
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // ─── 1. Check for existing auth on mount ───
  useEffect(() => {
    // Check for stored guest access token
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

  // ─── 2. Fetch bookings when authenticated ───
  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiCall(
        `${API_BASE}/api/v1/guest-bookings/by-email/`,
        { headers: apiHeaders(domain, accessToken) }
      );

      setBookings(data.bookings || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // Token expired or invalid — clear and show email form
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
    if (authState === "authenticated") {
      fetchBookings();
    }
  }, [authState, fetchBookings]);

  // ─── 3. Request OTP ───
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      setOtpSending(true);
      setAuthError("");

      await apiCall(`${API_BASE}/api/v1/guest-bookings/otp/send/`, {
        method: "POST",
        headers: apiHeaders(domain),
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      setCustomerEmail(emailInput.trim());
      setAuthState("otp");
    } catch (err) {
      if (err.status === 429) {
        setAuthError("Code already sent. Please wait before requesting again.");
      } else {
        setAuthError(err.data?.detail || "Failed to send verification code.");
      }
    } finally {
      setOtpSending(false);
    }
  };

  // ─── 4. Verify OTP → get token ───
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    try {
      setOtpVerifying(true);
      setAuthError("");

      const data = await apiCall(`${API_BASE}/api/v1/guest-bookings/otp/verify/`, {
        method: "POST",
        headers: apiHeaders(domain),
        body: JSON.stringify({
          email: customerEmail,
          otp: otpCode.trim(),
        }),
      });

      const newToken = data.token;
      const newTenantId = data.tenant_id || resolvedTenantId || tenantIdProp;

      // Store with tenantId key
      if (newTenantId) {
        try {
          localStorage.setItem(tokenKey(newTenantId), newToken);
          localStorage.setItem(emailStoreKey(newTenantId), customerEmail);
          console.log(`[CustomerBookingsDashboard] Stored token for tenant ${newTenantId}`);
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

  // ─── Logout ───
  const handleLogout = () => {
    clearStoredGuestToken(resolvedTenantId);
    setAccessToken(null);
    setBookings([]);
    setCustomerEmail("");
    setEmailInput("");
    setOtpCode("");
    setAuthState("email");
  };

  // =========================================================================
  // RENDER: AUTH GATE
  // =========================================================================

  if (authState === "checking") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (authState === "email") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-2">View Your Bookings</h2>
        <p className="text-gray-500 text-sm mb-6">
          Enter the email you used when making your booking.
        </p>
        <form onSubmit={handleRequestOTP}>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full border rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}
          <button
            type="submit"
            disabled={otpSending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {otpSending ? "Sending code..." : "Send Verification Code"}
          </button>
        </form>
      </div>
    );
  }

  if (authState === "otp") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-2">Enter Verification Code</h2>
        <p className="text-gray-500 text-sm mb-6">
          We sent a code to <strong>{customerEmail}</strong>
        </p>
        <form onSubmit={handleVerifyOTP}>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="w-full border rounded-lg px-4 py-3 mb-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}
          <button
            type="submit"
            disabled={otpVerifying || otpCode.length < 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {otpVerifying ? "Verifying..." : "Verify & View Bookings"}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <button
            onClick={() => { setAuthState("email"); setAuthError(""); setOtpCode(""); }}
            className="text-gray-500 hover:underline"
          >
            Use different email
          </button>
          <button
            onClick={handleRequestOTP}
            disabled={otpSending}
            className="text-blue-600 hover:underline"
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: BOOKINGS DASHBOARD
  // =========================================================================

  const filteredBookings =
    statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          {customerEmail && <p className="text-sm text-gray-500">{customerEmail}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={fetchBookings} className="text-sm text-blue-600 hover:underline">
            Refresh
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:underline">
            Sign out
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={fetchBookings} className="text-blue-600 hover:underline text-sm">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({bookings.length})
            </button>
            {Object.entries(statusCounts).map(([s, count]) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {STATUS_CONFIG[s]?.label || s} ({count})
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No bookings found</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all"
                  ? "Try a different filter."
                  : "Your bookings will appear here after you make a reservation."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => onSelectBooking?.(booking.id)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{booking.service_name || "Service"}</h3>
                      <p className="text-sm text-gray-500">#{booking.booking_number}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-gray-500">
                    <span>
                      {booking.currency || "$"} {Number(booking.amount_paid).toFixed(2)}
                    </span>
                    <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}