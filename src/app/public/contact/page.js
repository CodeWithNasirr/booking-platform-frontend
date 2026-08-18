"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Send,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ContactForm() {
  const searchParams = useSearchParams();
  const planInterest = searchParams.get("plan") || "";
  const isEnterprise = planInterest === "enterprise";

  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    company_name: "",
    company_size: "",
    expected_volume: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const input =
    "w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition";

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/billing/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plan_interest: planInterest,
          source: "contact_page",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) {
          setErrors({ _form: "Too many requests. Please try again later." });
        } else if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ _form: data.detail || "Something went wrong. Please try again." });
        }
        return;
      }
      setDone(true);
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Thanks — we&apos;ll be in touch</h1>
        <p className="text-slate-500 mb-8">
          Our sales team has received your request and will reach out shortly to
          discuss a tailored plan for your business.
        </p>
        <Link
          href="/public/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
        >
          Back to pricing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        {isEnterprise && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            Enterprise
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          {isEnterprise ? "Let's build your Enterprise plan" : "Talk to our team"}
        </h1>
        <p className="text-slate-500 max-w-md mx-auto">
          {isEnterprise
            ? "Tell us about your organization and we'll prepare a custom quote with the features, limits and contract terms you need."
            : "Have a question about plans, features or pricing? Send us a note and we'll get back to you."}
        </p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 md:p-8 space-y-5">
        {errors._form && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {errors._form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Full name" required error={errors.contact_name}>
            <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={input} placeholder="Jane Doe" />
          </FormField>
          <FormField label="Work email" required error={errors.contact_email}>
            <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={input} placeholder="jane@company.com" />
          </FormField>
          <FormField label="Phone" error={errors.contact_phone}>
            <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className={input} placeholder="+966 5X XXX XXXX" />
          </FormField>
          <FormField label="Company" error={errors.company_name}>
            <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} className={input} placeholder="Company name" />
          </FormField>
          <FormField label="Company size" error={errors.company_size}>
            <input value={form.company_size} onChange={(e) => set("company_size", e.target.value)} className={input} placeholder="e.g. 50–200" />
          </FormField>
          <FormField label="Expected monthly volume" error={errors.expected_volume}>
            <input value={form.expected_volume} onChange={(e) => set("expected_volume", e.target.value)} className={input} placeholder="e.g. 10,000 bookings/mo" />
          </FormField>
        </div>

        <FormField label="How can we help?" error={errors.message}>
          <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={4} className={`${input} resize-none`} placeholder="Tell us about your needs…" />
        </FormField>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold text-sm hover:shadow-lg disabled:opacity-50 transition"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isEnterprise ? "Request Enterprise quote" : "Send message"}
        </button>

        <p className="text-xs text-slate-400 text-center">
          By submitting you agree to be contacted by our sales team about your request.
        </p>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Mail className="w-4 h-4" /> sales@bookingplatform.com
        </span>
        <span className="inline-flex items-center gap-2">
          <Phone className="w-4 h-4" /> +966 11 000 0000
        </span>
      </div>
    </div>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
