// =============================================================================
// CONFIRM AND PAY COMPONENT
// =============================================================================
"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { formatDate } from "../utils/date";
import { formatTime } from "../utils/time";


export default function ConfirmAndPay({
  tenantId,
  domain,
  service,
  staff,
  date,
  time,
  customer,
  settings,
  bookingResult,
  isLoading,
  onConfirm,
  onReset,
  theme,
  lang,
  isRTL,
  booking,
}) {
  const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);


  const handlePay = async () => {
    if (!stripe || !elements) return;

    setIsPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      alert(error.message);
      setIsPaying(false);
      return;
    }

    // 5️⃣ Confirm backend
    const res = await fetch(
      `${API_BASE}/api/v1/bookings/${booking.id}/confirm_payment/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant": domain,
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id,
        }),
      }
    );

    const data = await res.json();

   // replace onSuccess(...) with:
  if (onConfirm) {
    onConfirm({ ...booking, ...data });
  }


    setIsPaying(false);
  };

  // Success State
  if (bookingResult) {
    return (
      <div className="p-6 text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl"
          style={{ backgroundColor: "#10B981" }}
        >
          ✓
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {resolveTranslated({ en: "Booking Confirmed!", ar: "تم تأكيد الحجز!", ur: "بکنگ کی تصدیق!" }, lang)}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {resolveTranslated({ 
            en: "A confirmation email has been sent to your email address.", 
            ar: "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.", 
            ur: "آپ کے ای میل ایڈریس پر تصدیقی ای میل بھیج دی گئی ہے۔" 
          }, lang)}
        </p>

        {/* Booking Details Card */}
        <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
          <div className="space-y-3">
            <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-gray-500">
                {resolveTranslated({ en: "Booking ID", ar: "رقم الحجز", ur: "بکنگ آئی ڈی" }, lang)}
              </span>
              <span className="font-semibold text-gray-900">
                {bookingResult.booking_id || bookingResult.id || "#" + Date.now().toString(36).toUpperCase()}
              </span>
            </div>
            
            <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-gray-500">
                {resolveTranslated({ en: "Service", ar: "الخدمة", ur: "سروس" }, lang)}
              </span>
              <span className="font-semibold text-gray-900">
                {resolveTranslated(service?.title || service?.name, lang)}
              </span>
            </div>
            
            <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-gray-500">
                {resolveTranslated({ en: "Date & Time", ar: "التاريخ والوقت", ur: "تاریخ اور وقت" }, lang)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatDate(date, lang)} • {formatTime(time)}
              </span>
            </div>
            
            {staff && (
              <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-gray-500">
                  {resolveTranslated({ en: "Therapist", ar: "المعالج", ur: "تھراپسٹ" }, lang)}
                </span>
                <span className="font-semibold text-gray-900">{staff.name}</span>
              </div>
            )}
            {bookingResult.meeting_url && (
              <a href={bookingResult.meeting_url} target="_blank">
                Join Meeting
              </a>
            )}

          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-4 justify-center ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            onClick={onReset}
            className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {resolveTranslated({ en: "Book Another", ar: "حجز آخر", ur: "ایک اور بک کریں" }, lang)}
          </button>
          
          <a
            href={`/bookings/id/${bookingResult.booking_id || bookingResult.id}`}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            {resolveTranslated({ en: "View Details", ar: "عرض التفاصيل", ur: "تفصیلات دیکھیں" }, lang)}
          </a>
        </div>
      </div>
    );
  }

  // Confirmation Form
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
        {resolveTranslated({ en: "Review Your Booking", ar: "مراجعة حجزك", ur: "اپنی بکنگ کا جائزہ لیں" }, lang)}
      </h3>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-2xl p-6 max-w-lg mx-auto mb-6">
        {/* Service */}
        <div className={`flex gap-4 mb-6 pb-6 border-b ${isRTL ? "flex-row-reverse" : ""}`}>
          {service?.image && (
            <img
              src={service.image}
              alt={resolveTranslated(service.title || service.name, lang)}
              className="w-20 h-20 rounded-xl object-cover"
            />
          )}
          <div className={isRTL ? "text-right" : ""}>
            <h4 className="font-semibold text-gray-900 text-lg">
              {resolveTranslated(service?.title || service?.name, lang)}
            </h4>
            <p className="text-gray-500">{service?.duration_minutes} min</p>
            {staff && (
              <p className="text-sm text-gray-600">
                {resolveTranslated({ en: "with", ar: "مع", ur: "کے ساتھ" }, lang)} {staff.name}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <DetailRow
            label={resolveTranslated({ en: "Date", ar: "التاريخ", ur: "تاریخ" }, lang)}
            value={formatDate(date, lang)}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Time", ar: "الوقت", ur: "وقت" }, lang)}
            value={formatTime(time)}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Name", ar: "الاسم", ur: "نام" }, lang)}
            value={customer.name}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Email", ar: "البريد", ur: "ای میل" }, lang)}
            value={customer.email}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Phone", ar: "الهاتف", ur: "فون" }, lang)}
            value={customer.phone}
            isRTL={isRTL}
          />
        </div>

        {/* Price Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="text-lg font-semibold text-gray-900">
              {resolveTranslated({ en: "Total", ar: "المجموع", ur: "کل" }, lang)}
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: theme.primary_color || "#3B82F6" }}
            >
              {resolveTranslated(service?.base_price || service?.price_label, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="max-w-lg mx-auto mb-6 p-4 bg-yellow-50 rounded-xl">
          <p className={`text-sm text-yellow-800 ${isRTL ? "text-right" : ""}`}>
            <strong>{resolveTranslated({ en: "Special Requests:", ar: "طلبات خاصة:", ur: "خصوصی درخواستیں:" }, lang)}</strong>{" "}
            {customer.notes}
          </p>
        </div>
      )}

      {/* Terms */}
      <div className="max-w-lg mx-auto mb-6">
        <label className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm text-gray-600 ${isRTL ? "text-right" : ""}`}>
            {resolveTranslated({
              en: "I agree to the cancellation policy and terms of service",
              ar: "أوافق على سياسة الإلغاء وشروط الخدمة",
              ur: "میں کینسلیشن پالیسی اور سروس کی شرائط سے متفق ہوں"
            }, lang)}
          </span>
        </label>
      </div>

      {/* Confirm Button */}
      <div className="max-w-lg mx-auto mb-6">
         <PaymentElement />
        <button
          onClick={handlePay}
          disabled={!stripe || isPaying}
          className="w-full py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {isPaying ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)}
            </>
          ) : (
            <>
              {resolveTranslated({ en: "Confirm & Pay", ar: "تأكيد الحجز", ur: "بکنگ کی تصدیق" }, lang)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}