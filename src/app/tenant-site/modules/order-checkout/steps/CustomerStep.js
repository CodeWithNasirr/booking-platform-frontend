// src/app/tenant-site/modules/order-checkout/steps/CustomerStep.js
"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import OrderSummary from "../components/OrderSummary";

const FIELDS = [
  { id: "name", type: "text", label: { en: "Full Name", ar: "الاسم الكامل", ur: "پورا نام" } },
  { id: "email", type: "email", label: { en: "Email", ar: "البريد الإلكتروني", ur: "ای میل" } },
  { id: "phone", type: "tel", label: { en: "Phone", ar: "الهاتف", ur: "فون" } },
];

export default function CustomerStep({
  service,
  selectedPackage,
  customerData,
  onChange,
  currentPrice,
  currency,
  deliveryDays,
  revisionsAllowed,
  onProceed,
  onBack,
  paying,
  theme,
  lang,
  isRTL,
}) {
  return (
    <div className="mt-6 space-y-6">
      <OrderSummary
        service={service}
        pkg={selectedPackage}
        price={currentPrice}
        deliveryDays={deliveryDays}
        revisionsAllowed={revisionsAllowed}
        currency={currency}
        theme={theme}
        lang={lang}
        isRTL={isRTL}
      />

      {/* Customer form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">
          {resolveTranslated({ en: "Your Information", ar: "معلوماتك", ur: "آپ کی معلومات" }, lang)}
        </h3>
        {FIELDS.map((f) => (
          <div key={f.id}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {resolveTranslated(f.label, lang)}
              <span className="text-danger ms-1">*</span>
            </label>
            <input
              type={f.type}
              value={customerData[f.id] || ""}
              onChange={(e) => onChange({ ...customerData, [f.id]: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
        </button>
        <button
          onClick={onProceed}
          disabled={paying}
          className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)}
            </>
          ) : (
            resolveTranslated({ en: "Proceed to Payment", ar: "متابعة الدفع", ur: "ادائیگی کے لیے آگے بڑھیں" }, lang)
          )}
        </button>
      </div>
    </div>
  );
}
