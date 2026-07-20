"use client";

/**
 * Provider Booking Detail workspace.
 *
 * The booking equivalent of the provider order detail page. Reuses the
 * existing collaboration system (CallDock → CallPanel/CallStage/CallCard →
 * useWebRTCSession) with NO duplicated logic — booking calls run through the
 * same CollaborationService/access rules as orders (subjectType="booking").
 *
 * Voice / video / screen-share come from CallDock; file sharing (M2) reuses
 * the existing BookingFile endpoints. Access follows the backend rules:
 * a call can only start on a collaborable booking (paid / scheduled).
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  DollarSign,
  Video,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Cookies from "js-cookie";
import DashboardLayout from "@/components/provider/DashboardLayout";
import { useApp } from "@/contexts/AppContext";
import { CallDock } from "@/components/collaboration";
import BookingConversationPanel from "@/components/bookings/BookingConversationPanel";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Backend BOOKING_ACTIVE_STATUSES — the only states a call may start in.
const COLLABORABLE = ["paid", "scheduled"];

function fmtDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dt;
  }
}
function fmtTime(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const tone =
    s === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "cancelled" || s === "refunded"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : s === "scheduled" || s === "paid"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${tone}`}>
      {(status || "unknown").replace(/_/g, " ")}
    </span>
  );
}

function BookingDetailInner() {
  const { id: bookingId } = useParams();
  const router = useRouter();
  const { activeTenant, user } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json",
          "X-Tenant": tenantId || "",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load booking (${res.status})`);
      setBooking(await res.json());
    } catch (e) {
      setError(e.message || "Failed to load booking.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, tenantId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-sm">{error || "Booking not found."}</p>
        <button
          onClick={() => router.push("/provider/bookings")}
          className="text-sm text-[#800020] hover:underline"
        >
          Back to bookings
        </button>
      </div>
    );
  }

  const customerName =
    booking.customer?.name ||
    booking.customer_name ||
    booking.customer?.full_name ||
    "Customer";
  const serviceName = booking.service?.name || booking.service_name || "Service";
  const collaborable = COLLABORABLE.includes(booking.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/provider/bookings")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{serviceName}</h1>
          <p className="text-sm text-gray-500">
            Booking #{booking.booking_number || booking.id}
          </p>
        </div>
        <StatusPill status={booking.status} />
      </div>

      {/* ── Live collaboration ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-4 h-4 text-[#800020]" />
          <h2 className="text-sm font-semibold text-gray-900">Live session</h2>
        </div>
        {collaborable ? (
          <>
            <p className="text-xs text-gray-500 mb-3">
              Start a voice or video call with the customer, or share your screen.
              Incoming calls ring here too.
            </p>
            <CallDock
              subjectType="booking"
              subjectId={bookingId}
              tenantId={tenantId}
              authMode="jwt"
              jwt={Cookies.get("access_token") || null}
              selfUserId={user?.id}
              selfName={user?.full_name || user?.name || "You"}
              canStart
            />
          </>
        ) : (
          <p className="text-xs text-gray-400">
            Calls are available once the booking is paid or scheduled.
          </p>
        )}
      </div>

      {/* ── Conversation — chat + files + timeline ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Messages &amp; Files</h2>
        <BookingConversationPanel
          bookingId={bookingId}
          domain={tenantId}
          auth={{ jwt: Cookies.get("access_token") || null }}
          viewer="provider"
          showComposer={!["cancelled", "refunded"].includes(booking.status)}
        />
      </div>

      {/* ── Details ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Details</h3>
          <Row icon={User} label="Customer" value={customerName} />
          <Row
            icon={Calendar}
            label="Date"
            value={fmtDate(booking.scheduled_datetime)}
          />
          <Row
            icon={Clock}
            label="Time"
            value={
              booking.scheduled_datetime
                ? `${fmtTime(booking.scheduled_datetime)}${
                    booking.duration_minutes ? ` · ${booking.duration_minutes} min` : ""
                  }`
                : "—"
            }
          />
          <Row
            icon={DollarSign}
            label="Total"
            value={
              booking.total_amount != null
                ? `${booking.total_amount} ${booking.currency || "SAR"}`
                : "—"
            }
          />
        </div>

        {/* External meeting fallback, if one was scheduled */}
        {booking.meeting_url && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Scheduled meeting
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {booking.meeting_provider || "External meeting"} link for this booking.
            </p>
            <a
              href={booking.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Video className="w-4 h-4" /> Open meeting link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium truncate">{value}</span>
    </div>
  );
}

export default function ProviderBookingDetailPage() {
  const { t } = useApp();
  return (
    <DashboardLayout pageName={t("bookings_page_title") || "Booking"}>
      <BookingDetailInner />
    </DashboardLayout>
  );
}
