"use client";
// app/tenant-site/[domain]/my-bookings/page.js|| MyBookingsClient
import { useState } from "react";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated } from "../utils/resolveTranslated";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
import { useEffect } from "react";

export default function MyBookingsClient({ domain}) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const [step, setStep] = useState("email"); // email | otp | bookings
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* --------------------------------------------------
     STEP 1: SEND OTP
  -------------------------------------------------- */
  async function sendOTP() {
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/guest-bookings/otp/send/`,
        {
          method: "POST",
           headers: { "Content-Type": "application/json", "X-Tenant": domain },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) throw new Error("Failed to send OTP");

      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------------------------------
     STEP 2: VERIFY OTP + FETCH BOOKINGS
  -------------------------------------------------- */
  async function verifyOTP() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/guest-bookings/otp/verify/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Tenant": domain },
          body: JSON.stringify({ email, otp }),
        }
      );

      if (!res.ok) throw new Error("Invalid OTP");

      const { token } = await res.json();
      localStorage.setItem("guest_booking_token", token);
      const bookingsRes = await fetch(
        `${API_BASE}/api/v1/guest-bookings/by-email/`,
        {
          headers: {
            "X-Tenant": domain,
            Authorization: `Bearer ${token}`,
          },
        }
      );


      const data = await bookingsRes.json();
      console.log("Fetched Bookings:", data);
      setBookings(data.bookings || []);
      setStep("bookings");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------------------------------
     AUTO LOGIN IF TOKEN EXISTS
  -------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("guest_booking_token");
    if (!token) return;

    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/guest-bookings/by-email/`,
          {
            headers: {
              "X-Tenant": domain,
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Session expired");

        const data = await res.json();
        console.log("Fetched Bookings:", data);
        setBookings(data.bookings || []);
        setStep("bookings");
      } catch {
        localStorage.removeItem("guest_booking_token");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);


  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div className={`max-w-lg mx-auto p-6 ${isRTL ? "rtl" : ""}`}>
      <h1 className="text-2xl font-bold text-center mb-6">
        {resolveTranslated(
          { en: "My Bookings", ar: "حجوزاتي", ur: "میری بکنگز" },
          language
        )}
      </h1>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================= EMAIL STEP ================= */}
      {step === "email" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            {resolveTranslated(
              { en: "Email Address", ar: "البريد الإلكتروني", ur: "ای میل" },
              language
            )}
          </label>

          <input
            type="email"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir={isRTL ? "rtl" : "ltr"}
          />

          <button
            onClick={sendOTP}
            disabled={loading}
            className="w-full py-3 text-white rounded-xl font-semibold"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {loading
              ? resolveTranslated(
                  { en: "Sending...", ar: "جارٍ الإرسال...", ur: "بھیج رہا ہے..." },
                  language
                )
              : resolveTranslated(
                  { en: "Send OTP", ar: "إرسال رمز", ur: "OTP بھیجیں" },
                  language
                )}
          </button>
        </div>
      )}

      {/* ================= OTP STEP ================= */}
      {step === "otp" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            {resolveTranslated(
              { en: "Enter OTP", ar: "أدخل الرمز", ur: "OTP درج کریں" },
              language
            )}
          </label>

          <input
            type="text"
            className="w-full border rounded-xl px-4 py-3 text-center tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button
            onClick={verifyOTP}
            disabled={loading}
            className="w-full py-3 text-white rounded-xl font-semibold"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {loading
              ? resolveTranslated(
                  { en: "Verifying...", ar: "جارٍ التحقق...", ur: "تصدیق ہو رہی ہے..." },
                  language
                )
              : resolveTranslated(
                  { en: "Verify OTP", ar: "تحقق", ur: "تصدیق کریں" },
                  language
                )}
          </button>
        </div>
      )}

      {/* ================= BOOKINGS LIST ================= */}
      {step === "bookings" && (
        <div className="space-y-4">
          {bookings.length === 0 && (
            <p className="text-center text-gray-500">
              {resolveTranslated(
                {
                  en: "No bookings found for this email.",
                  ar: "لا توجد حجوزات لهذا البريد.",
                  ur: "اس ای میل کے لیے کوئی بکنگ نہیں۔",
                },
                language
              )}
            </p>
          )}

          {bookings.map((b) => (
            <div
              key={b.id}
              className="border rounded-xl p-4 bg-white shadow-sm space-y-2"
            >
              {/* TOP ROW */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base">
                  {resolveTranslated(b.service_name, language)}
                </h3>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium
                    ${
                      b.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : b.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {b.status.toUpperCase()}
                </span>
              </div>

              {/* BOOKING NUMBER */}
              <div className="text-sm text-gray-600">
                {resolveTranslated(
                  { en: "Booking ID", ar: "رقم الحجز", ur: "بکنگ آئی ڈی" },
                  language
                )}
                : <strong>{b.booking_number}</strong>
              </div>

              {/* PRICE */}
              <div className="text-sm text-gray-700">
                {resolveTranslated(
                  { en: "Amount Paid", ar: "المبلغ المدفوع", ur: "ادا شدہ رقم" },
                  language
                )}
                :{" "}
                <strong>
                  {b.currency} {Number(b.amount_paid).toFixed(2)}
                </strong>
              </div>

              {/* CREATED DATE */}
              <div className="text-xs text-gray-500">
                {new Date(b.created_at).toLocaleDateString()}
              </div>
              {/* VIEW DETAILS BUTTON */}
              <button
                onClick={() =>
                  window.location.href = `/booking/id/${b.id}`
                }
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                View details
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
