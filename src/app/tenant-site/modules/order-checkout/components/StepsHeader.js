// src/app/tenant-site/modules/order-checkout/components/StepsHeader.js
"use client";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";

const STEPS = [
  { id: "select", label: { en: "Select Package", ar: "اختر الباقة", ur: "پیکج منتخب کریں" } },
  { id: "details", label: { en: "Your Details", ar: "بياناتك", ur: "آپ کی تفصیلات" } },
  { id: "pay", label: { en: "Payment", ar: "الدفع", ur: "ادائیگی" } },
  { id: "done", label: { en: "Confirmed", ar: "تم التأكيد", ur: "تصدیق" } },
];

export default function StepsHeader({ currentStep, theme, lang, isRTL }) {
  const color = theme.primary_color || "#3B82F6";

  return (
    <div className="pb-6 border-b mb-6">
      <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        {STEPS.map((s, idx) => {
          const active = idx === currentStep;
          const done = idx < currentStep;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done || active ? "text-white" : "bg-gray-200 text-gray-500"
                }`}
                style={{ backgroundColor: done || active ? color : undefined }}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                className={`ml-2 text-xs font-medium hidden sm:block ${
                  active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {resolveTranslated(s.label, lang)}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${done ? "" : "bg-gray-200"}`}
                  style={{ backgroundColor: done ? color : undefined }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { STEPS };