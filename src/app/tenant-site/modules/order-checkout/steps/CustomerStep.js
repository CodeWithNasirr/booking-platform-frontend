// src/app/tenant-site/modules/order-checkout/steps/CustomerStep.js
"use client";

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
  const color = theme.primary_color || "#3B82F6";

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
        <h3 className="text-lg font-bold text-gray-900">
          {resolveTranslated(
            { en: "Your Information", ar: "معلوماتك", ur: "آپ کی معلومات" },
            lang
          )}
        </h3>
        {FIELDS.map((f) => (
          <div key={f.id}>
            <label
              className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? "text-right" : ""}`}
            >
              {resolveTranslated(f.label, lang)}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type={f.type}
              value={customerData[f.id] || ""}
              onChange={(e) => onChange({ ...customerData, [f.id]: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
        </button>
        <button
          onClick={onProceed}
          disabled={paying}
          className="flex-1 py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {paying
            ? resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)
            : resolveTranslated({ en: "Proceed to Payment", ar: "متابعة الدفع", ur: "ادائیگی کے لیے آگے بڑھیں" }, lang)}
        </button>
      </div>
    </div>
  );
}