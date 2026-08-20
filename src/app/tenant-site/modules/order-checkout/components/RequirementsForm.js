// src/app/tenant-site/modules/order-checkout/components/RequirementsForm.js
"use client";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";

export default function RequirementsForm({ schema, values, onChange, lang, isRTL }) {
  if (!schema?.length) return null;

  const inputClass =
    "w-full h-12 px-4 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">
        {resolveTranslated({ en: "Project Requirements", ar: "متطلبات المشروع", ur: "پروجیکٹ کی ضروریات" }, lang)}
      </h3>
      {schema.map((field) => {
        const label = resolveTranslated(field.label, lang) || field.label || field.name;
        const placeholder = resolveTranslated(field.placeholder, lang) || "";
        const fieldName = field.name || field.id;

        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {label}
              {field.required && <span className="text-danger ms-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={values[fieldName] || ""}
                onChange={(e) => onChange({ ...values, [fieldName]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                className={`${inputClass} h-auto py-3 resize-none`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            ) : field.type === "select" ? (
              <select
                value={values[fieldName] || ""}
                onChange={(e) => onChange({ ...values, [fieldName]: e.target.value })}
                className={inputClass}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">
                  {resolveTranslated({ en: "-- Select --", ar: "-- اختر --", ur: "-- منتخب کریں --" }, lang)}
                </option>
                {field.options?.map((opt) => (
                  <option key={opt.value || opt} value={opt.value || opt}>
                    {resolveTranslated(opt.label, lang) || opt.label || opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                value={values[fieldName] || ""}
                onChange={(e) => onChange({ ...values, [fieldName]: e.target.value })}
                placeholder={placeholder}
                className={inputClass}
                dir={isRTL ? "rtl" : "ltr"}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
