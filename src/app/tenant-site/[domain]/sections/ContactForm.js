"use client";

import { useState } from "react";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { useTenantSite } from "../TenantClientWrapper";
import { resolveTranslated } from "../utils/resolveTranslated";

export default function ContactForm({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const { site } = useTenantSite();
  
  const lang = propLang || language;

  const {
    title,
    subtitle,
    show_map = false,
    map_embed,
    show_contact_info = true,
    contact_info = {},
    fields = ["name", "email", "phone", "message"],
    submit_text,
    success_message,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedSubmitText = resolveTranslated(submit_text, lang) || "Send Message";
  const resolvedSuccessMessage = resolveTranslated(success_message, lang) || "Thank you! We'll get back to you soon.";

  // Form state
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/website/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Domain": site?.domain || window.location.hostname,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to submit");
      
      setSubmitted(true);
      setFormData({});
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Field configurations
  const fieldConfig = {
    name: { label: "Name", type: "text", required: true },
    email: { label: "Email", type: "email", required: true },
    phone: { label: "Phone", type: "tel", required: false },
    subject: { label: "Subject", type: "text", required: false },
    message: { label: "Message", type: "textarea", required: true },
  };

  return (
    <section className={`py-20 px-6 bg-gray-50 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
            )}
          </div>
        )}

        <div className={`grid ${show_contact_info || show_map ? "md:grid-cols-2" : ""} gap-12`}>
          {/* Contact Info / Map Column */}
          {(show_contact_info || show_map) && (
            <div>
              {show_contact_info && (
                <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                  
                  <div className="space-y-4">
                    {(contact_info.email || site?.contact_email) && (
                      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                        >
                          ✉️
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <a 
                            href={`mailto:${contact_info.email || site?.contact_email}`}
                            className="text-gray-900 font-medium hover:underline"
                          >
                            {contact_info.email || site?.contact_email}
                          </a>
                        </div>
                      </div>
                    )}

                    {(contact_info.phone || site?.contact_phone) && (
                      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                        >
                          📞
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <a 
                            href={`tel:${contact_info.phone || site?.contact_phone}`}
                            className="text-gray-900 font-medium hover:underline"
                          >
                            {contact_info.phone || site?.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {(contact_info.address || site?.address) && (
                      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                        >
                          📍
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-gray-900 font-medium">
                            {resolveTranslated(contact_info.address || site?.address, lang)}
                          </p>
                        </div>
                      </div>
                    )}

                    {contact_info.hours && (
                      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                        >
                          🕐
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hours</p>
                          <p className="text-gray-900 font-medium">{contact_info.hours}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map */}
              {show_map && map_embed && (
                <div 
                  className="rounded-2xl overflow-hidden shadow-lg h-64"
                  dangerouslySetInnerHTML={{ __html: map_embed }}
                />
              )}
            </div>
          )}

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {submitted ? (
              <div className="text-center py-12">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl"
                  style={{ backgroundColor: theme.primary_color || "#10B981" }}
                >
                  ✓
                </div>
                <p className="text-xl text-gray-900">{resolvedSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {fields.map((field) => {
                  const config = fieldConfig[field] || { label: field, type: "text" };
                  
                  if (config.type === "textarea") {
                    return (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {config.label} {config.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          name={field}
                          rows={4}
                          required={config.required}
                          value={formData[field] || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:border-transparent transition-all"
                          style={{ focusRing: theme.primary_color || "#3B82F6" }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {config.label} {config.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={config.type}
                        name={field}
                        required={config.required}
                        value={formData[field] || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:border-transparent transition-all"
                      />
                    </div>
                  );
                })}

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-white rounded-xl font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                >
                  {isSubmitting ? "Sending..." : resolvedSubmitText}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
