// src/app/tenant-site/modules/order-checkout/components/RequirementsForm.js
"use client";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";

export default function RequirementsForm({ schema, values, onChange, lang, isRTL }) {
  if (!schema?.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">
        {resolveTranslated({ en: "Project Requirements", ar: "متطلبات المشروع", ur: "پروجیکٹ کی ضروریات" }, lang)}
      </h3>
      {schema.map((field) => {
        const label = resolveTranslated(field.label, lang) || field.label || field.name;
        const placeholder = resolveTranslated(field.placeholder, lang) || "";
        const fieldName = field.name || field.id;

        return (
          <div key={fieldName}>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? "text-right" : ""}`}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={values[fieldName] || ""}
                onChange={(e) => onChange({ ...values, [fieldName]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              />
            ) : field.type === "select" ? (
              <select
                value={values[fieldName] || ""}
                onChange={(e) => onChange({ ...values, [fieldName]: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">-- Select --</option>
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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}