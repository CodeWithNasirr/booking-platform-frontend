"use client";

/**
 * OrderCheckout.js
 *
 * Customer checkout flow for digital services (order_type="digital").
 * Route: /services/{slug}/order
 *
 * Steps:
 *  1. Service/package selection + requirements form
 *  2. Customer info (guest checkout)
 *  3. Stripe payment
 *  4. Confirmation
 *
 * Uses same Stripe Elements pattern as BookingModule.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { resolveTranslated } from "../[domain]/utils/resolveTranslated";
import { initiateOrderPayment, confirmOrderPayment, getStatusConfig } from "@/lib/orderApi";


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function OrderCheckout({ service, domain }) {
  console.log(service)
  const router = useRouter();
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = language;

  // State

  // State
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [requirements, setRequirements] = useState({});
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [step, setStep] = useState(0); // 0=select,1=details,2=pay,3=done
  const [clientSecret, setClientSecret] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  // Fetch service
  useEffect(() => {
    if (service?.packages?.length === 1) {
      setSelectedPackage(service.packages[0]);
    }
  }, [service]);

  const currentPrice = selectedPackage?.price || service?.base_price || service?.price || 0;
  const deliveryDays = selectedPackage?.delivery_days || service?.estimated_delivery_days || 7;
  const revisionsAllowed = selectedPackage?.revisions || service?.revisions_allowed || 1;

  const steps = [
    { id: "select", label: { en: "Select Package", ar: "اختر الباقة", ur: "پیکج منتخب کریں" } },
    { id: "details", label: { en: "Your Details", ar: "بياناتك", ur: "آپ کی تفصیلات" } },
    { id: "pay", label: { en: "Payment", ar: "الدفع", ur: "ادائیگی" } },
    { id: "done", label: { en: "Confirmed", ar: "تم التأكيد", ur: "تصدیق" } },
  ];

  // ── Step 1 → 2: validate package selection ──
  const handleContinueToDetails = () => {
    if (!selectedPackage && service?.packages?.length > 0) {
      setError(resolveTranslated({ en: "Please select a package", ar: "يرجى اختيار باقة", ur: "براہ کرم پیکج منتخب کریں" }, lang));
      return;
    }
    setError(null);
    setStep(1);
  };

  // ── Step 2 → 3: create order + get client_secret ──
  const handleProceedToPayment = async () => {
    if (!customerData.name || !customerData.email || !customerData.phone) {
      setError(resolveTranslated({ en: "All fields are required", ar: "جميع الحقول مطلوبة", ur: "تمام فیلڈز ضروری ہیں" }, lang));
      return;
    }
    setError(null);
    setPaying(true);

    try {
      const payload = {
        service_id: service.id,
        package_id: selectedPackage?.id || null,
        requirements,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
      };
      const result = await initiateOrderPayment(domain, payload);
      setClientSecret(result.client_secret);
      setOrderResult({ order_id: result.order_id, order_number: result.order_number });
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  // ── Loading / Error ──
  // if (loading) {
  //   return (
  //     <div className="max-w-3xl mx-auto p-8">
  //       <div className="animate-pulse space-y-6">
  //         <div className="h-8 bg-gray-200 rounded w-1/2" />
  //         <div className="h-48 bg-gray-200 rounded-xl" />
  //         <div className="h-48 bg-gray-200 rounded-xl" />
  //       </div>
  //     </div>
  //   );
  // }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {resolveTranslated({ en: "Service not found", ar: "الخدمة غير موجودة", ur: "سروس نہیں ملی" }, lang)}
        </h2>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-gray-100 rounded-lg text-gray-700">
          {resolveTranslated({ en: "Go Back", ar: "رجوع", ur: "واپس جائیں" }, lang)}
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto p-6 md:p-8 ${isRTL ? "rtl" : ""}`}>
      {/* Steps Header */}
      <StepsHeader steps={steps} currentStep={step} theme={theme} lang={lang} isRTL={isRTL} />

      {/* Error Banner */}
      {error && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ─── Step 0: Package Selection ─── */}
      {step === 0 && (
        <div className="mt-6 space-y-6">
          {/* Service Header */}
          <ServiceHeader service={service} theme={theme} lang={lang} isRTL={isRTL} />

          {/* Package Cards */}
          {service.packages?.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                {resolveTranslated({ en: "Choose a Package", ar: "اختر باقة", ur: "پیکج منتخب کریں" }, lang)}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {service.packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selectedPackage?.id === pkg.id}
                    onSelect={() => setSelectedPackage(pkg)}
                    theme={theme}
                    lang={lang}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl text-center">
              <p className="text-2xl font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
                ${Number(currentPrice).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {resolveTranslated({ en: "Delivery in", ar: "التسليم خلال", ur: "ڈیلیوری" }, lang)} {deliveryDays}{" "}
                {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
              </p>
            </div>
          )}

          {/* Requirements Form (dynamic) */}
          {service.requirements_schema?.length > 0 && (
            <RequirementsForm
              schema={service.requirements_schema}
              values={requirements}
              onChange={setRequirements}
              lang={lang}
              isRTL={isRTL}
            />
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinueToDetails}
            className="w-full py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {resolveTranslated({ en: "Continue", ar: "متابعة", ur: "جاری رکھیں" }, lang)} — $
            {Number(currentPrice).toFixed(2)}
          </button>
        </div>
      )}

      {/* ─── Step 1: Customer Details ─── */}
      {step === 1 && (
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

          <CustomerDetailsForm
            data={customerData}
            onChange={setCustomerData}
            lang={lang}
            isRTL={isRTL}
          />

          <div className="flex gap-4">
            <button
              onClick={() => setStep(0)}
              className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
            </button>
            <button
              onClick={handleProceedToPayment}
              disabled={paying}
              className="flex-1 py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {paying
                ? resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)
                : resolveTranslated({ en: "Proceed to Payment", ar: "متابعة الدفع", ur: "ادائیگی کے لیے آگے بڑھیں" }, lang)}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Stripe Payment ─── */}
      {step === 2 && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentStep
            domain={domain}
            orderId={orderResult?.order_id}
            orderNumber={orderResult?.order_number}
            service={service}
            pkg={selectedPackage}
            price={currentPrice}
            deliveryDays={deliveryDays}
            onSuccess={(data) => {
              setOrderResult((prev) => ({ ...prev, ...data }));
              setStep(3);
            }}
            onBack={() => setStep(1)}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        </Elements>
      )}

      {/* ─── Step 3: Confirmation ─── */}
      {step === 3 && (
        <ConfirmationStep
          orderResult={orderResult}
          service={service}
          pkg={selectedPackage}
          deliveryDays={deliveryDays}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StepsHeader({ steps, currentStep, theme, lang, isRTL }) {
  return (
    <div className="pb-6 border-b mb-6">
      <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        {steps.map((s, idx) => {
          const active = idx === currentStep;
          const done = idx < currentStep;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done || active ? "text-white" : "bg-gray-200 text-gray-500"}`}
                style={{ backgroundColor: done || active ? theme.primary_color || "#3B82F6" : undefined }}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span className={`ml-2 text-xs font-medium hidden sm:block ${active ? "text-gray-900" : "text-gray-400"}`}>
                {resolveTranslated(s.label, lang)}
              </span>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${done ? "" : "bg-gray-200"}`}
                  style={{ backgroundColor: done ? theme.primary_color || "#3B82F6" : undefined }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceHeader({ service, theme, lang, isRTL }) {
  const title = resolveTranslated(service.name, lang);
  const desc = resolveTranslated(service.description || service.short_description, lang);
  return (
    <div className={`flex gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
      {service.image && (
        <img src={service.image} alt={title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
      )}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
        {desc && <p className="text-gray-600 text-sm">{desc}</p>}
      </div>
    </div>
  );
}

function PackageCard({ pkg, selected, onSelect, theme, lang, isRTL }) {
  const name = resolveTranslated(pkg.name || pkg.title, lang) || pkg.name;
  const desc = resolveTranslated(pkg.description, lang);
  return (
    <button
      onClick={onSelect}
      className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md w-full ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}
      style={{ borderColor: selected ? theme.primary_color || "#3B82F6" : undefined }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900">{name}</h4>
        <span className="text-xl font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
          ${Number(pkg.price).toFixed(2)}
        </span>
      </div>
      {desc && <p className="text-sm text-gray-500 mb-3">{desc}</p>}
      <div className="flex gap-4 text-xs text-gray-500">
        {pkg.delivery_days && (
          <span>🚀 {pkg.delivery_days} {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}</span>
        )}
        {pkg.revisions != null && (
          <span>🔄 {pkg.revisions} {resolveTranslated({ en: "revisions", ar: "مراجعات", ur: "ریویژنز" }, lang)}</span>
        )}
      </div>
      {/* Features list */}
      {pkg.features?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {pkg.features.map((f, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {resolveTranslated(f, lang) || f}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

function RequirementsForm({ schema, values, onChange, lang, isRTL }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">
        {resolveTranslated({ en: "Project Requirements", ar: "متطلبات المشروع", ur: "پروجیکٹ کی ضروریات" }, lang)}
      </h3>
      {schema.map((field) => {
        const label = resolveTranslated(field.label, lang) || field.label || field.name;
        return (
          <div key={field.name || field.id}>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? "text-right" : ""}`}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.name] || ""}
                onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
                placeholder={resolveTranslated(field.placeholder, lang) || ""}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.name] || ""}
                onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">-- Select --</option>
                {field.options?.map((opt) => (
                  <option key={opt.value || opt} value={opt.value || opt}>
                    {resolveTranslated(opt.label, lang) || opt.label || opt}
                  </option>
                ))}
              </select>
            ) : field.type === "file" ? (
              <input
                type="file"
                onChange={(e) => onChange({ ...values, [field.name]: e.target.files[0] })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
              />
            ) : (
              <input
                type={field.type || "text"}
                value={values[field.name] || ""}
                onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
                placeholder={resolveTranslated(field.placeholder, lang) || ""}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CustomerDetailsForm({ data, onChange, lang, isRTL }) {
  const fields = [
    { id: "name", type: "text", label: { en: "Full Name", ar: "الاسم الكامل", ur: "پورا نام" }, required: true },
    { id: "email", type: "email", label: { en: "Email", ar: "البريد الإلكتروني", ur: "ای میل" }, required: true },
    { id: "phone", type: "tel", label: { en: "Phone", ar: "الهاتف", ur: "فون" }, required: true },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">
        {resolveTranslated({ en: "Your Information", ar: "معلوماتك", ur: "آپ کی معلومات" }, lang)}
      </h3>
      {fields.map((f) => (
        <div key={f.id}>
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? "text-right" : ""}`}>
            {resolveTranslated(f.label, lang)}
            {f.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={f.type}
            value={data[f.id] || ""}
            onChange={(e) => onChange({ ...data, [f.id]: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
          />
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ service, pkg, price, deliveryDays, revisionsAllowed, theme, lang, isRTL }) {
  const title = resolveTranslated(service.name, lang);
  const pkgName = pkg ? resolveTranslated(pkg.name || pkg.title, lang) || pkg.name : null;
  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
      <h4 className="font-bold text-gray-900">{title}</h4>
      {pkgName && <p className="text-sm text-gray-600">📦 {pkgName}</p>}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {resolveTranslated({ en: "Delivery", ar: "التسليم", ur: "ڈیلیوری" }, lang)}
        </span>
        <span className="font-medium">
          {deliveryDays} {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {resolveTranslated({ en: "Revisions", ar: "المراجعات", ur: "ریویژنز" }, lang)}
        </span>
        <span className="font-medium">{revisionsAllowed}</span>
      </div>
      <div className="flex justify-between pt-3 border-t">
        <span className="text-lg font-bold text-gray-900">
          {resolveTranslated({ en: "Total", ar: "المجموع", ur: "کل" }, lang)}
        </span>
        <span className="text-2xl font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
          ${Number(price).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function PaymentStep({ domain, orderId, orderNumber, service, pkg, price, deliveryDays, onSuccess, onBack, theme, lang, isRTL }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeErr) {
      setError(stripeErr.message);
      setPaying(false);
      return;
    }

    try {
      const result = await confirmOrderPayment(domain, {
        order_id: orderId,
        payment_intent_id: paymentIntent.id,
      });
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
        pkg={pkg}
        price={price}
        deliveryDays={deliveryDays}
        revisionsAllowed={pkg?.revisions || service?.revisions_allowed || 1}
        theme={theme}
        lang={lang}
        isRTL={isRTL}
      />

      <div className="bg-white rounded-xl border p-6">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <div className="flex gap-4">
        <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium">
          {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
        </button>
        <button
          onClick={handlePay}
          disabled={!stripe || paying}
          className="flex-1 py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
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
            resolveTranslated({ en: "Pay Now", ar: "ادفع الآن", ur: "ابھی ادا کریں" }, lang) +
            ` — $${Number(price).toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}

function ConfirmationStep({ orderResult, service, pkg, deliveryDays, theme, lang, isRTL }) {
  const title = resolveTranslated(service.title || service.name, lang);
  return (
    <div className="mt-8 text-center space-y-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-4xl"
        style={{ backgroundColor: "#10B981" }}
      >
        ✓
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {resolveTranslated({ en: "Order Confirmed!", ar: "تم تأكيد الطلب!", ur: "آرڈر کی تصدیق!" }, lang)}
        </h2>
        <p className="text-gray-600">
          {resolveTranslated(
            {
              en: "Your order has been placed. You'll receive a confirmation email shortly.",
              ar: "تم تقديم طلبك. ستتلقى رسالة تأكيد بالبريد الإلكتروني قريباً.",
              ur: "آپ کا آرڈر مکمل ہو گیا ہے۔ آپ کو جلد ہی تصدیقی ای میل موصول ہو گی۔",
            },
            lang
          )}
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
        <Row label={resolveTranslated({ en: "Order", ar: "الطلب", ur: "آرڈر" }, lang)}
             value={orderResult?.order_number || orderResult?.order_id} isRTL={isRTL} />
        <Row label={resolveTranslated({ en: "Service", ar: "الخدمة", ur: "سروس" }, lang)}
             value={title} isRTL={isRTL} />
        <Row label={resolveTranslated({ en: "Expected Delivery", ar: "التسليم المتوقع", ur: "متوقع ڈیلیوری" }, lang)}
             value={`${deliveryDays} ${resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}`} isRTL={isRTL} />
        <div className="flex justify-between pt-3 border-t">
          <span className="font-bold text-gray-900">
            {resolveTranslated({ en: "Total Paid", ar: "المبلغ المدفوع", ur: "کل ادائیگی" }, lang)}
          </span>
          <span className="font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
            ${Number(orderResult?.total_amount || pkg?.price || service?.base_price || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <a
          href={`/orders/${orderResult?.order_id}`}
          className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {resolveTranslated({ en: "View Order", ar: "عرض الطلب", ur: "آرڈر دیکھیں" }, lang)}
        </a>
        <a href="/" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">
          {resolveTranslated({ en: "Back to Home", ar: "العودة للرئيسية", ur: "ہوم پر واپس" }, lang)}
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, isRTL }) {
  return (
    <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}