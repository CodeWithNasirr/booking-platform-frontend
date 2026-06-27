// src/app/tenant-site/modules/order-checkout/steps/PaymentStep.js
"use client";

/**
 * PaymentStep — Stripe Payment Element
 *
 * Handles:
 *   - Stripe confirmPayment()
 *   - Backend confirmOrderPayment()
 *   - Guest access token storage after successful payment
 */

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { confirmOrderPayment } from "@/lib/orderApi";
import OrderSummary from "../components/OrderSummary";
import { formatCurrency } from "@/lib/currency";
export default function PaymentStep({
  domain,
  orderId,
  service,
  selectedPackage,
  currentPrice,
  deliveryDays,
  revisionsAllowed,
  onSuccess,
  onBack,
  theme,
  lang,
  isRTL,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const color = theme.primary_color || "#3B82F6";

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    // 1. Confirm with Stripe
    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      
    });

  

    if (stripeErr) {
      setError(stripeErr.message);
      setPaying(false);
      return;
    }

    // Payment still processing (3DS or async)
    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      setPaying(false);
      return;
    }

    // 2. Confirm with backend
    try {
      const result = await confirmOrderPayment(domain, orderId, paymentIntent.id);

      // 3. Store guest access token for post-checkout order viewing
      if (result?.guest_access_token && result?.tenant_id) {
        try {
          localStorage.setItem(
            `customer_order_token_${result.tenant_id}`,
            result.guest_access_token
          );
          if (result.customer_email) {
            localStorage.setItem(
              `customer_order_email_${result.tenant_id}`,
              result.customer_email
            );
          }
        } catch (e) {
          console.warn("Failed to store guest token:", e);
        }
      }

      onSuccess(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <OrderSummary
        service={service}
        pkg={selectedPackage}
        price={currentPrice}
        deliveryDays={deliveryDays}
        revisionsAllowed={revisionsAllowed}
        theme={theme}
        lang={lang}
        isRTL={isRTL}
      />

      <div className="bg-white rounded-xl border p-6">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium">
          {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
        </button>
        <button
          onClick={handlePay}
          disabled={!stripe || paying}
          className="flex-1 py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: color }}
        >
          {paying ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)}
            </>
          ) : (
            `${resolveTranslated(
  { en: "Pay Now", ar: "ادفع الآن", ur: "ابھی ادا کریں" },
  lang
)} — ${formatCurrency(currentPrice, service.currency)}`
          )}
        </button>
      </div>
    </div>
  );
}