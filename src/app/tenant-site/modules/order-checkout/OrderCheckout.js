// src/app/tenant-site/modules/order-checkout/OrderCheckout.js
"use client";

/**
 * OrderCheckout — Orchestrator
 *
 * Thin wrapper that:
 *   1. Uses useCheckoutState for localStorage persistence + session ID
 *   2. Handles initiate-payment (with idempotency via checkout_session_id)
 *   3. Resumes from saved state after page refresh
 *   4. Delegates rendering to step components
 *
 * Duplicate prevention:
 *   - checkout_session_id generated once per checkout session
 *   - Sent to backend as idempotency key
 *   - If order already exists (hasExistingOrder), skips initiate and
 *     goes straight to Stripe payment with saved clientSecret
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { detectGateway, GATEWAY, buildHyperPayCallbackUrl } from "@/lib/paymentGateway";
import HyperPayWidget from "@/components/payment/HyperPayWidget";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated } from "../../[domain]/utils/resolveTranslated";
import { initiateOrderPayment } from "@/lib/orderApi";

import { Search, ChevronLeft } from "lucide-react";
import useCheckoutState from "./hooks/useCheckoutState";
import StepsHeader from "./components/StepsHeader";
import PackageStep from "./steps/PackageStep";
import CustomerStep from "./steps/CustomerStep";
import PaymentStep from "./steps/PaymentStep";
import ConfirmationStep from "./steps/ConfirmationStep";
import { brandStyle } from "./brandVars";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function OrderCheckout({ service, domain }) {
  const router = useRouter();
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = language;

  // ─── Persistent checkout state ───
  const checkout = useCheckoutState(domain, service?.slug);

  // ─── Local UI state (not persisted) ───
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  // ─── Resolve selected package from saved ID ───
  const selectedPackage = service?.packages?.find(
    (p) => p.id === checkout.selectedPackageId
  ) || (service?.packages?.length === 1 ? service.packages[0] : null);

  const currentPrice = selectedPackage?.price || service?.base_price || service?.price || 0;
  const deliveryDays = selectedPackage?.delivery_days || service?.estimated_delivery_days || 7;
  const revisionsAllowed = selectedPackage?.revisions || service?.revisions_allowed || 1;

  // ─── Wait for hydration from localStorage ───
  if (!checkout.hydrated) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-8" style={brandStyle(theme)}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-8 text-center" style={brandStyle(theme)}>
        <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          {resolveTranslated({ en: "Service not found", ar: "الخدمة غير موجودة", ur: "سروس نہیں ملی" }, lang)}
        </h2>
        <button onClick={() => router.back()} className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 bg-muted border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/70 transition">
          <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {resolveTranslated({ en: "Go Back", ar: "رجوع", ur: "واپس جائیں" }, lang)}
        </button>
      </div>
    );
  }


  function HyperPayOrderStep({
    checkoutId,
    widgetUrl,
    brands,
    callbackUrl,
    service,
    selectedPackage,
    currentPrice,
    deliveryDays,
    revisionsAllowed,
    onBack,
    theme,
    lang,
    isRTL,
  }) {
    // Import OrderSummary inline to avoid circular deps
    const OrderSummary = require("./components/OrderSummary").default;
  
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
          <HyperPayWidget
            checkoutId={checkoutId}
            widgetUrl={widgetUrl}
            brands={brands || ["VISA", "MASTER", "MADA"]}
            callbackUrl={callbackUrl}
            lang={lang}
            isRTL={isRTL}
            theme={theme}
          />
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-10 px-3 -ms-1 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
        </button>
      </div>
    );
  }

  // ─── Step 0 → 1: Validate package selection ───
  const handleContinueToDetails = () => {
    if (!selectedPackage && service?.packages?.length > 0) {
      setError(resolveTranslated(
        { en: "Please select a package", ar: "يرجى اختيار باقة", ur: "براہ کرم پیکج منتخب کریں" },
        lang
      ));
      return;
    }
    setError(null);
    checkout.setStep(1);
  };

  // ─── Step 1 → 2: Create order OR resume existing ───
  const handleProceedToPayment = async () => {
    const { customerData } = checkout;

    if (!customerData.name || !customerData.email || !customerData.phone) {
      setError(resolveTranslated(
        { en: "All fields are required", ar: "جميع الحقول مطلوبة", ur: "تمام فیلڈز ضروری ہیں" },
        lang
      ));
      return;
    }

    // If we already have an order from a previous attempt, skip initiate
    if (checkout.hasExistingOrder) {
      checkout.setStep(2);
      return;
    }

    setError(null);
    setPaying(true);

    try {
      const payload = {
        service_slug: service.slug,
        package_id: selectedPackage?.id || null,
        requirements: checkout.requirements,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        // Idempotency: backend uses this to prevent duplicate orders
        checkout_session_id: checkout.checkoutSessionId,
        // Tenant-site origin so the backend returns the customer to this
        // domain's /my-orders/<id> after Moyasar payment.
        origin: typeof window !== "undefined" ? window.location.origin : "",
      };

      const result = await initiateOrderPayment(domain, payload);
      console.log("PAYMENT RESPONSE:", result);

      // Moyasar hosted-invoice flow: redirect the customer to the hosted
      // payment page. Backend verifies the real status on callback/webhook.
      if (result.gateway === "moyasar" && result.redirect_url) {
        window.location.href = result.redirect_url;
        return;
      }

      const gateway = detectGateway(result);
 
      // Persist payment state (survives refresh)
      checkout.setPaymentReady({
        clientSecret: result.client_secret || null,
        orderId: result.order_id,
        orderNumber: result.order_number,
        totalAmount: result.total_amount,
        currency: result.currency,
        // NEW: gateway-specific fields
        gateway: gateway,
        checkoutId: result.checkout_id || null,
        widgetUrl: result.widget_url || null,
        brands: result.brands || null,
        callbackUrl: result.callback_url || null,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  // ─── Step 2 → 3: Payment confirmed ───
  const handlePaymentSuccess = (confirmData) => {
    checkout.setCompleted(confirmData);
  };

  return (
    <div
      className={`max-w-3xl mx-auto p-4 sm:p-6 md:p-8 ${isRTL ? "rtl" : ""}`}
      style={brandStyle(theme)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <StepsHeader currentStep={checkout.step} theme={theme} lang={lang} isRTL={isRTL} />

      {/* Error banner */}
      {error && (
        <div className="my-4 p-4 bg-danger-soft border border-danger/20 rounded-xl text-danger-soft-foreground text-sm flex justify-between items-start gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-danger hover:opacity-70 font-bold shrink-0" aria-label="Dismiss">×</button>
        </div>
      )}

      {/* ─── Step 0: Package Selection ─── */}
      {checkout.step === 0 && (
        <PackageStep
          service={service}
          selectedPackage={selectedPackage}
          requirements={checkout.requirements}
          onSelectPackage={(pkg) => checkout.setSelectedPackageId(pkg.id)}
          onChangeRequirements={checkout.setRequirements}
          onContinue={handleContinueToDetails}
          currentPrice={currentPrice}
          currency={service.currency}
          deliveryDays={deliveryDays}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}

      {/* ─── Step 1: Customer Details ─── */}
      {checkout.step === 1 && (
        <CustomerStep
          service={service}
          selectedPackage={selectedPackage}
          customerData={checkout.customerData}
          onChange={checkout.setCustomerData}
          currentPrice={currentPrice}
          currency={service.currency}
          deliveryDays={deliveryDays}
          revisionsAllowed={revisionsAllowed}
          onProceed={handleProceedToPayment}
          onBack={() => checkout.setStep(0)}
          paying={paying}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}

      {/* ─── Step 2: Payment (Stripe or HyperPay) ─── */}
      {checkout.step === 2 && (
        checkout.gateway === GATEWAY.HYPERPAY ? (
          // ── HyperPay: Widget-based payment ──
          <HyperPayOrderStep
            checkoutId={checkout.checkoutId}
            widgetUrl={checkout.widgetUrl}
            brands={checkout.brands}
            callbackUrl={checkout.callbackUrl || buildHyperPayCallbackUrl("order", checkout.orderId)}
            service={service}
            selectedPackage={selectedPackage}
            currentPrice={currentPrice}
            deliveryDays={deliveryDays}
            revisionsAllowed={revisionsAllowed}
            onBack={() => checkout.setStep(1)}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        ) : checkout.clientSecret ? (
          // ── Stripe: Existing Elements flow ──
          <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
            <PaymentStep
              domain={domain}
              orderId={checkout.orderId}
              service={service}
              selectedPackage={selectedPackage}
              currentPrice={currentPrice}
              deliveryDays={deliveryDays}
              revisionsAllowed={revisionsAllowed}
              onSuccess={handlePaymentSuccess}
              onBack={() => checkout.setStep(1)}
              theme={theme}
              lang={lang}
              isRTL={isRTL}
            />
          </Elements>
        ) : null
      )}

      {/* ─── Step 3: Confirmation ─── */}
      {checkout.step === 3 && (
        <ConfirmationStep
          orderId={checkout.orderId}
          orderNumber={checkout.orderNumber}
          totalAmount={checkout.totalAmount}
          service={service}
          selectedPackage={selectedPackage}
          deliveryDays={deliveryDays}
          onReset={checkout.reset}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}