"use client";

import { useState } from "react";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { useTenantSite } from "../[domain]/TenantClientWrapper";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CustomRequestModule({ data, settings, tenantId, domain }) {
  const { isRTL, language } = useTenantLang();
  const { theme } = useTenantTheme();
  const { currency } = useTenantSite();

  const primaryColor = theme?.primary_color || "#8B1E3F";

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      if (form.budget_min) formData.append("budget_min", form.budget_min);
      if (form.budget_max) formData.append("budget_max", form.budget_max);
      if (form.deadline) formData.append("deadline", form.deadline);
      formData.append("customer_name", form.customer_name);
      formData.append("customer_email", form.customer_email);
      if (form.customer_phone) formData.append("customer_phone", form.customer_phone);

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await fetch(`${API_BASE}/api/v1/custom-requests/`, {
        method: "POST",
        headers: {
          "X-Tenant": domain,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
          {language === "ar" ? "تم إرسال طلبك" : "Request Submitted"}
        </h2>
        <p className="text-gray-600 mb-6">
          {language === "ar"
            ? "سنراجع طلبك ونرد عليك قريبا"
            : "We'll review your request and get back to you soon."}
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({
              title: "",
              description: "",
              budget_min: "",
              budget_max: "",
              deadline: "",
              customer_name: "",
              customer_email: "",
              customer_phone: "",
            });
            setFiles([]);
          }}
          className="px-6 py-2 rounded-lg text-white transition hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          {language === "ar" ? "إرسال طلب آخر" : "Submit Another Request"}
        </button>
      </div>
    );
  }

  const labelClass = `block text-sm font-medium text-gray-700 mb-1 ${isRTL ? "text-right" : "text-left"}`;
  const inputClass = `w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${isRTL ? "text-right" : "text-left"}`;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <h2 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
        {language === "ar" ? "طلب خدمة مخصصة" : "Request Custom Service"}
      </h2>
      <p className="text-gray-600 mb-8 text-sm">
        {language === "ar"
          ? "أخبرنا بما تحتاجه وسنعود إليك بعرض سعر"
          : "Tell us what you need and we'll get back to you with a quote."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>
            {language === "ar" ? "العنوان" : "Title"} *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className={inputClass}
            style={{ "--tw-ring-color": primaryColor }}
            placeholder={language === "ar" ? "ماذا تحتاج؟" : "What do you need?"}
          />
        </div>

        <div>
          <label className={labelClass}>
            {language === "ar" ? "الوصف" : "Description"} *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            className={inputClass}
            style={{ "--tw-ring-color": primaryColor }}
            placeholder={language === "ar" ? "قدم تفاصيل حول طلبك..." : "Provide details about your request..."}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              {language === "ar" ? "الحد الأدنى للميزانية" : "Budget Min"}
            </label>
            <input
              type="number"
              name="budget_min"
              value={form.budget_min}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={inputClass}
              style={{ "--tw-ring-color": primaryColor }}
              placeholder={currency || "USD"}
            />
          </div>
          <div>
            <label className={labelClass}>
              {language === "ar" ? "الحد الأقصى للميزانية" : "Budget Max"}
            </label>
            <input
              type="number"
              name="budget_max"
              value={form.budget_max}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={inputClass}
              style={{ "--tw-ring-color": primaryColor }}
              placeholder={currency || "USD"}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            {language === "ar" ? "الموعد النهائي" : "Deadline"}
          </label>
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            className={inputClass}
            style={{ "--tw-ring-color": primaryColor }}
          />
        </div>

        <div>
          <label className={labelClass}>
            {language === "ar" ? "المرفقات" : "Attachments"}
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          {files.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {files.length} {language === "ar" ? "ملف(ات) محددة" : "file(s) selected"}
            </p>
          )}
        </div>

        <hr className="border-gray-200" />

        <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
          {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
        </h3>

        <div>
          <label className={labelClass}>
            {language === "ar" ? "الاسم" : "Name"} *
          </label>
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            required
            className={inputClass}
            style={{ "--tw-ring-color": primaryColor }}
          />
        </div>

        <div>
          <label className={labelClass}>
            {language === "ar" ? "البريد الإلكتروني" : "Email"} *
          </label>
          <input
            type="email"
            name="customer_email"
            value={form.customer_email}
            onChange={handleChange}
            required
            className={inputClass}
            style={{ "--tw-ring-color": primaryColor }}
          />
        </div>

        <div>
          <label className={labelClass}>
            {language === "ar" ? "الهاتف" : "Phone"}
          </label>
          <input
            type="tel"
            name="customer_phone"
            value={form.customer_phone}
            onChange={handleChange}
            className={inputClass}
            style={{ "--tw-ring-color": primaryColor }}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {submitting
            ? language === "ar" ? "جارٍ الإرسال..." : "Submitting..."
            : language === "ar" ? "إرسال الطلب" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
