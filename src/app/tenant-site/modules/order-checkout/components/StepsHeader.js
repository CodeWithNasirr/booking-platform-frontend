// src/app/tenant-site/modules/order-checkout/components/StepsHeader.js
"use client";

import { Check } from "lucide-react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";

const STEPS = [
  { id: "select", label: { en: "Select Package", ar: "اختر الباقة", ur: "پیکج منتخب کریں" } },
  { id: "details", label: { en: "Your Details", ar: "بياناتك", ur: "آپ کی تفصیلات" } },
  { id: "pay", label: { en: "Payment", ar: "الدفع", ur: "ادائیگی" } },
  { id: "done", label: { en: "Confirmed", ar: "تم التأكيد", ur: "تصدیق" } },
];

export default function StepsHeader({ currentStep, theme, lang, isRTL }) {
  const pct = STEPS.length > 1 ? (currentStep / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="pb-5 border-b border-border mb-6">
      {/* Mobile: progress bar + label */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {resolveTranslated({ en: "Step", ar: "خطوة", ur: "مرحلہ" }, lang)} {currentStep + 1} / {STEPS.length}
          </span>
          <span className="text-sm font-semibold text-foreground truncate ps-3">
            {resolveTranslated(STEPS[currentStep]?.label, lang)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden sm:flex items-center">
        {STEPS.map((s, idx) => {
          const active = idx === currentStep;
          const done = idx < currentStep;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                  done || active
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`ms-2 text-xs font-medium whitespace-nowrap ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {resolveTranslated(s.label, lang)}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 rounded-full ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { STEPS };
