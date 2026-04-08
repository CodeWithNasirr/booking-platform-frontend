// src/app/tenant-site/modules/CustomerOrdersDashboard.js
"use client";

/**
 * CustomerOrdersDashboard — Module with Self-Contained Auth
 *
 * Renders inside LayoutRenderer as a module (order_dashboard).
 * Handles its own customer access:
 *   - Authenticated user → fetch orders with Bearer token
 *   - Guest → email → OTP → signed token via X-Order-Token header
 *
 * Refinements:
 *   - Token storage keyed by tenantId (not domain)
 *   - Guest uses X-Order-Token header; auth user uses Authorization: Bearer
 *   - TimestampSigner token on backend (not JWT)
 */

import { useState, useEffect, useCallback } from "react";

// ─── API helpers ───

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function apiHeaders(domain, token, isGuestToken) {
  const h = { "Content-Type": "application/json" };
  if (domain) h["X-Tenant"] = domain;

  if (token) {
    if (isGuestToken) {
      h["X-Order-Token"] = token;
    } else {
      h["Authorization"] = `Bearer ${token}`;
    }
  }

  return h;
}

async function apiCall(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    credentials: "include", // 👈 add this
  });

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
  return `customer_order_token_${tenantId}`;
}
function emailStoreKey(tenantId) {
  return `customer_order_email_${tenantId}`;
}



/**
 * Find any stored guest token.
 * When tenantId is known, checks the exact key.
 * When tenantId is unknown (LayoutRenderer), scans all keys.
 */
function findStoredGuestToken(tenantId) {
  try {
    // Exact match when tenantId known
    if (tenantId) {
      const token = localStorage.getItem(tokenKey(tenantId));
      const email = localStorage.getItem(emailStoreKey(tenantId));
      if (token) return { token, email: email || "", tenantId };
    }

    // Fallback: scan for any customer_order_token_* key
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


// ─── Status config ───

const STATUS_CONFIG = {
  pending_payment: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800" },
  paid:            { label: "Paid",            color: "bg-blue-100 text-blue-800" },
  in_progress:     { label: "In Progress",     color: "bg-purple-100 text-purple-800" },
  delivered:       { label: "Delivered",        color: "bg-green-100 text-green-800" },
  completed:       { label: "Completed",        color: "bg-green-200 text-green-900" },
  cancelled:       { label: "Cancelled",        color: "bg-red-100 text-red-800" },
  refunded:        { label: "Refunded",         color: "bg-gray-100 text-gray-800" },
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

export default function CustomerOrdersDashboard({
  domain,
  tenantId: tenantIdProp ,
  onSelectOrder,
  token: externalToken,
}) {
  // ─── Auth state ───
  const [authState, setAuthState] = useState("checking");
  const [accessToken, setAccessToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  // Resolved tenantId (from prop or from stored token)
  const [resolvedTenantId, setResolvedTenantId] = useState(tenantIdProp || null);

  // ─── OTP state ───
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  // ─── Orders state ───
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // ─── 1. Check for existing auth on mount ───
  useEffect(() => {
    // Parent passed a JWT (e.g. MyOrdersClient with full user auth)
    if (externalToken) {
      setAccessToken(externalToken);
      setIsGuestToken(false);
      setAuthState("authenticated");
      return;
    }

    // Check for stored guest access token
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

  // ─── 2. Fetch orders when authenticated ───
  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiCall(
        `${API_BASE}/api/v1/orders/my-orders/`,
        { headers: apiHeaders(domain, accessToken, isGuestToken) }
      );

      setOrders(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // Token expired or invalid — clear and show email form
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
    if (authState === "authenticated") {
      fetchOrders();
    }
  }, [authState, fetchOrders]);

  // ─── 3. Request OTP ───
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      setOtpSending(true);
      setAuthError("");

      await apiCall(`${API_BASE}/api/v1/orders/request-access/`, {
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

  // ─── 4. Verify OTP → get signed token ───
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    try {
      setOtpVerifying(true);
      setAuthError("");

      const data = await apiCall(`${API_BASE}/api/v1/orders/verify-access/`, {
        method: "POST",
        headers: apiHeaders(domain),
        body: JSON.stringify({
          email: customerEmail,
          code: otpCode.trim(),
        }),
      });

      const newToken = data.token;
      const newTenantId = data.tenant_id || resolvedTenantId;

      // Store with tenantId key
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

   // ─── Logout ───
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
        <h2 className="text-xl font-bold mb-2">View Your Orders</h2>
        <p className="text-gray-500 text-sm mb-6">
          Enter the email you used when placing your order.
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
          We sent a 6-digit code to <strong>{customerEmail}</strong>
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
            {otpVerifying ? "Verifying..." : "Verify & View Orders"}
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
  // RENDER: ORDERS DASHBOARD
  // =========================================================================

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          {customerEmail && <p className="text-sm text-gray-500">{customerEmail}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={fetchOrders} className="text-sm text-blue-600 hover:underline">
            Refresh
          </button>
          {isGuestToken && (
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:underline">
              Sign out
            </button>
          )}
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
          <button onClick={fetchOrders} className="text-blue-600 hover:underline text-sm">
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
              All ({orders.length})
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

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No orders found</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all"
                  ? "Try a different filter."
                  : "Your orders will appear here after you make a purchase."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder?.(order.id)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {order.service_name || "Service"}
                        </h3>

                        {/* ✅ Unread badge */}
                        {order.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                            {order.unread_count > 9 ? "9+" : order.unread_count}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500">
                        #{order.order_number}
                      </p>
                    </div>
                   
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-gray-500">
                    <span>{order.currency || "$"} {order.total_amount}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
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