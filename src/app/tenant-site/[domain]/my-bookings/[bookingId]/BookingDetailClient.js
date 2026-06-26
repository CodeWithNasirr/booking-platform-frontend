// src/app/tenant-site/[domain]/my-bookings/[bookingId]/BookingDetailClient.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LayoutRenderer from "../../LayoutRenderer";

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

export default function BookingDetailClient({
  domain,
  site,
  header,
  footer,
  bookingId,
}) {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const tenantId = site?.tenant?.id || site?.id;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchBookingDetail = useCallback(async () => {
    if (!isClient) return;

    try {
      setLoading(true);
      setError(null);

      const auth = resolveToken(tenantId);
      console.log(`[BookingDetail] Looking for booking: ${bookingId}`);

      if (!auth.token) {
        router.replace(`/${domain}/my-bookings`);
        return;
      }

      // Go straight to list endpoint (individual endpoint doesn't exist)
      const res = await fetch(
        `${API_BASE}/api/v1/guest-bookings/by-email/`,
        { headers: buildHeaders(domain, auth.token) }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(`customer_booking_token_${tenantId}`);
          localStorage.removeItem(`customer_booking_email_${tenantId}`);
          localStorage.removeItem("guest_booking_token");
          router.replace(`/${domain}/my-bookings`);
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
    if (isClient) fetchBookingDetail();
  }, [fetchBookingDetail, isClient]);

  const handleBack = () => router.push(`/${domain}/my-bookings`);

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

  if (!isClient) {
    return (
      <>
        {header?.length > 0 && <LayoutRenderer sections={[header]} site={site} />}
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
          </div>
        </main>
        {footer?.length > 0 && <LayoutRenderer sections={[footer]} site={site} />}
      </>
    );
  }

  if (loading) {
    return (
      <>
        {header?.length > 0 && <LayoutRenderer sections={[header]} site={site} />}
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
            </div>
          </div>
        </main>
        {footer?.length > 0 && <LayoutRenderer sections={[footer]} site={site} />}
      </>
    );
  }

  if (error) {
    return (
      <>
        {header?.length > 0 && <LayoutRenderer sections={[header]} site={site} />}
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <button onClick={handleBack} className="mb-6 text-sm text-gray-600 hover:text-gray-900">
              ← Back to My Bookings
            </button>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchBookingDetail} className="px-4 py-2 bg-blue-600 text-white rounded-xl mr-2">
                Try Again
              </button>
              <button onClick={handleBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl">
                Go Back
              </button>
            </div>
          </div>
        </main>
        {footer?.length > 0 && <LayoutRenderer sections={[footer]} site={site} />}
      </>
    );
  }

  if (!booking) return null;

  return (
    <>
      {header?.length > 0 && <LayoutRenderer sections={[header]} site={site} />}

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button onClick={handleBack} className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            ← Back to My Bookings
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {booking.service_name || "Service"}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Booking #{booking.booking_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {booking.id}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize w-fit ${getStatusColor(booking.status)}`}>
                  {(booking.status || "unknown").replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatMoney(booking.total_amount, booking.currency)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Amount Paid</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatMoney(booking.amount_paid, booking.currency)}
                  </p>
                </div>
                {booking.amount_remaining > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Remaining</p>
                    <p className="text-xl font-bold text-orange-900">
                      {formatMoney(booking.amount_remaining, booking.currency)}
                    </p>
                  </div>
                )}
              </div>

              {/* Scheduling Info */}
              {(booking.scheduled_date || booking.scheduled_datetime) && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                    📅 Scheduled For
                  </h3>
                  <p className="text-lg font-medium text-indigo-800">
                    {formatDateTime(
                      booking.scheduled_date || booking.scheduled_datetime,
                      booking.scheduled_time,
                      booking.timezone
                    )}
                  </p>
                  {booking.duration_minutes && (
                    <p className="text-sm text-indigo-600 mt-1">
                      Duration: {booking.duration_minutes} minutes
                    </p>
                  )}
                </div>
              )}

              {/* Meeting Link */}
              {booking.meeting_url && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    🔗 Meeting Link
                  </h3>
                  <a 
                    href={booking.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-900 hover:underline break-all font-medium"
                  >
                    {booking.meeting_url}
                  </a>
                  {booking.meeting_provider && (
                    <p className="text-xs text-green-600 mt-1 capitalize">
                      via {booking.meeting_provider.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
              )}

              {/* Customer Notes */}
              {booking.customer_notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{booking.customer_notes}</p>
                </div>
              )}

              {/* Requirements */}
              {booking.requirements && Object.keys(booking.requirements).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Requirements</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {Object.entries(booking.requirements).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium capitalize">{key}:</span>
                        <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">{formatDate(booking.created_at)}</span>
                  </div>
                  {booking.confirmed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Confirmed</span>
                      <span className="text-gray-700">{formatDate(booking.confirmed_at)}</span>
                    </div>
                  )}
                  {booking.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed</span>
                      <span className="text-gray-700">{formatDate(booking.completed_at)}</span>
                    </div>
                  )}
                  {booking.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-red-500">Cancelled</span>
                      <span className="text-red-700">{formatDate(booking.cancelled_at)}</span>
                    </div>
                  )}
                  {booking.cancelled_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-600 text-xs">
                      Reason: {booking.cancelled_reason}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                ← Back to List
              </button>
              
              {booking.status === "scheduled" && (
                <button
                  onClick={() => alert("Cancel functionality coming soon")}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                >
                  Cancel Booking
                </button>
              )}
              
              {booking.status === "completed" && (
                <button
                  onClick={() => alert("Review functionality coming soon")}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                >
                  Leave Review
                </button>
              )}

              {booking.meeting_url && (
                <a
                  href={booking.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium ml-auto"
                >
                  Join Meeting →
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {footer?.length > 0 && <LayoutRenderer sections={[footer]} site={site} />}
    </>
  );
}