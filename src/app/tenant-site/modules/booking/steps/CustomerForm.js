// =============================================================================
// CUSTOMER FORM COMPONENT
// =============================================================================
"use client";

import { useState } from "react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";


export default function CustomerForm({ customerData, onDataChange, onSubmit, theme, lang, isRTL }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    onDataChange({ ...customerData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!customerData.name?.trim()) {
      newErrors.name = resolveTranslated({ en: "Name is required", ar: "الاسم مطلوب", ur: "نام ضروری ہے" }, lang);
    }
    
    if (!customerData.email?.trim()) {
      newErrors.email = resolveTranslated({ en: "Email is required", ar: "البريد الإلكتروني مطلوب", ur: "ای میل ضروری ہے" }, lang);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = resolveTranslated({ en: "Invalid email", ar: "بريد إلكتروني غير صالح", ur: "غلط ای میل" }, lang);
    }
    
    if (!customerData.phone?.trim()) {
      newErrors.phone = resolveTranslated({ en: "Phone is required", ar: "الهاتف مطلوب", ur: "فون ضروری ہے" }, lang);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  const fields = [
    {
      id: "name",
      type: "text",
      label: { en: "Full Name", ar: "الاسم الكامل", ur: "پورا نام" },
      placeholder: { en: "Enter your full name", ar: "أدخل اسمك الكامل", ur: "اپنا پورا نام درج کریں" },
      required: true,
    },
    {
      id: "email",
      type: "email",
      label: { en: "Email Address", ar: "البريد الإلكتروني", ur: "ای میل ایڈریس" },
      placeholder: { en: "your@email.com", ar: "your@email.com", ur: "your@email.com" },
      required: true,
    },
    {
      id: "phone",
      type: "tel",
      label: { en: "Phone Number", ar: "رقم الهاتف", ur: "فون نمبر" },
      placeholder: { en: "+1 (555) 123-4567", ar: "+966 50 123 4567", ur: "+92 300 1234567" },
      required: true,
    },
    {
      id: "notes",
      type: "textarea",
      label: { en: "Special Requests (Optional)", ar: "طلبات خاصة (اختياري)", ur: "خصوصی درخواستیں (اختیاری)" },
      placeholder: { en: "Any allergies, preferences, or special requests...", ar: "أي حساسية أو تفضيلات أو طلبات خاصة...", ur: "کوئی الرجی، ترجیحات، یا خصوصی درخواستیں..." },
      required: false,
    },
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
        {resolveTranslated({ en: "Your Information", ar: "معلوماتك", ur: "آپ کی معلومات" }, lang)}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? "text-right" : ""}`}>
              {resolveTranslated(field.label, lang)}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === "textarea" ? (
              <textarea
                value={customerData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={resolveTranslated(field.placeholder, lang)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:border-transparent ${
                  errors[field.id] ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                } ${isRTL ? "text-right" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            ) : (
              <input
                type={field.type}
                value={customerData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={resolveTranslated(field.placeholder, lang)}
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:border-transparent ${
                  errors[field.id] ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                } ${isRTL ? "text-right" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            )}
            
            {errors[field.id] && (
              <p className={`mt-1 text-sm text-red-500 ${isRTL ? "text-right" : ""}`}>
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-4 text-white rounded-xl font-semibold text-lg mt-6 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {resolveTranslated({ en: "Continue", ar: "متابعة", ur: "جاری رکھیں" }, lang)}
        </button>
      </form>
    </div>
  );
}