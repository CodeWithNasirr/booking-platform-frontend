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
import { ChevronLeft, Loader2 } from "lucide-react";
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
        currency={service.currency}
        theme={theme}
        lang={lang}
        isRTL={isRTL}
      />

      <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-4 bg-danger-soft border border-danger/20 rounded-xl text-danger-soft-foreground text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
        </button>
        <button
          onClick={handlePay}
          disabled={!stripe || paying}
          className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)}
            </>
          ) : (
            `${resolveTranslated({ en: "Pay Now", ar: "ادفع الآن", ur: "ابھی ادا کریں" }, lang)} — ${formatCurrency(currentPrice, service.currency)}`
          )}
        </button>
      </div>
    </div>
  );
}
