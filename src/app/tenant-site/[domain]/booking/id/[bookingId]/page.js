import { notFound } from "next/navigation";
import { fetchSite } from "../../../utils/fetchSite";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
import { formatCurrency } from "@/lib/currency";
export default async function BookingDetailsPage({ params }) {
  const { domain, bookingId } = await params;

  const { site, error } = await fetchSite(domain);
  if (error || !site?.is_published) notFound();

  const res = await fetch(
    `${API_BASE}/api/v1/bookings/${bookingId}/`,
    {
      cache: "no-store",
      headers: { "X-Tenant": domain },
    }
  );

  if (!res.ok) notFound();

  const booking = await res.json();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Booking Confirmed 🎉
        </h1>
        <p className="text-gray-500">
          Booking ID: <span className="font-medium">{booking.booking_number}</span>
        </p>
      </div>

      {/* Status Card */}
      <div className="rounded-xl border bg-white p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-semibold capitalize text-green-600">
            {booking.status.replace("_", " ")}
          </p>
        </div>

        {booking.meeting_url && (
          <a
            href={booking.meeting_url}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition"
          >
            Join Meeting →
          </a>
        )}
      </div>

      {/* Booking Info */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Service */}
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h2 className="font-semibold text-lg">Service</h2>
          <p className="text-gray-800">{booking.service_name}</p>
          <p className="text-sm text-gray-500 capitalize">
            {booking.booking_type.replace("_", " ")}
          </p>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h2 className="font-semibold text-lg">Schedule</h2>
          <p className="text-gray-800">
            {booking.scheduled_date} at {booking.scheduled_time}
          </p>
          <p className="text-sm text-gray-500">
            Timezone: {booking.timezone}
          </p>
          <p className="text-sm text-gray-500">
            Duration: {booking.duration_minutes} minutes
          </p>
        </div>

        {/* Provider */}
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h2 className="font-semibold text-lg">Provider</h2>
          <p className="text-gray-800">{booking.provider_name}</p>
        </div>

        {/* Customer */}
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h2 className="font-semibold text-lg">Customer</h2>
          <p className="text-gray-800">{booking.customer_name}</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="font-semibold text-lg">Payment Summary</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {formatCurrency(
                booking.subtotal,
                booking.currency || site?.currency || "USD"
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>
  {formatCurrency(
    booking.platform_fee,
    booking.currency || site?.currency || "USD"
  )}
</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total Paid</span>
                  <span>
        {formatCurrency(
          booking.amount_paid,
          booking.currency || site?.currency || "USD"
        )}
      </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {booking.customer_notes && (
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h2 className="font-semibold text-lg">Notes</h2>
          <p className="text-gray-700">{booking.customer_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Need help? Contact support anytime.
      </div>

    </div>
  );
}


// 🧠 Why this UI works

// Hierarchy first → Status + Meeting link are obvious

// Scannable cards → No wall of text

// Human language → “Booking Confirmed”, not “status = scheduled”

// Mobile safe → Single column stacks cleanly

// Future-proof → Easy to add:

// invoice download

// reschedule button

// cancel booking

// review submission

// 🔥 Optional Enhancements (next level)

// If you want, next we can add:

// 📄 Download Invoice PDF

// ⏰ Calendar Add (Google / Outlook)

// ⭐ Post-meeting Review UI

// 🔐 Hide internal fields in public serializer

// 🎨 Brand colors per tenant