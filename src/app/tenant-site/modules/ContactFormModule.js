"use client";

import { useState } from "react";
import { useTenantTheme } from "../contexts/TenantThemeContext";

export default function ContactFormModule({ settings, tenantId, domain, lang }) {
  const theme = useTenantTheme();
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    variant = "standard",
    fields = ["name", "email", "phone", "subject", "message"],
    subject_options = [],
    submit_button,
    success_message,
    show_map = false,
    map_embed,
  } = settings || {};

  const resolveText = (text) => {
    if (typeof text === "object") return text[lang] || text.en || "";
    return text || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/v1/website/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Domain": domain,
        },
        body: JSON.stringify({ ...formData, tenant_id: tenantId }),
      });
      
      if (res.ok) {
        setSubmitted(true);
        setFormData({});
      }
    } catch (err) {
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 bg-green-50 rounded-xl">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-xl text-gray-900">
          {resolveText(success_message) || "Thank you! We'll be in touch soon."}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${show_map ? "md:grid-cols-2" : ""} gap-8`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.includes("name") && (
          <input
            type="text"
            placeholder="Your Name"
            required
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent"
          />
        )}
        
        {fields.includes("email") && (
          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent"
          />
        )}
        
        {fields.includes("phone") && (
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent"
          />
        )}
        
        {fields.includes("subject") && subject_options.length > 0 && (
          <select
            value={formData.subject || ""}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent"
          >
            <option value="">Select Subject</option>
            {subject_options.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {resolveText(opt.label)}
              </option>
            ))}
          </select>
        )}
        
        {fields.includes("message") && (
          <textarea
            placeholder="Your Message"
            required
            rows={4}
            value={formData.message || ""}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent"
          />
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-white rounded-xl font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {loading ? "Sending..." : resolveText(submit_button) || "Send Message"}
        </button>
      </form>

      {show_map && map_embed && (
        <div
          className="rounded-xl overflow-hidden h-64 md:h-full"
          dangerouslySetInnerHTML={{ __html: map_embed }}
        />
      )}
    </div>
  );
}