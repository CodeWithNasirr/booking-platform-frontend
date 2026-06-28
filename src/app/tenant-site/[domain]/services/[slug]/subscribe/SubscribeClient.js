"use client";

/**
 * SubscribeClient
 *
 * Subscription checkout for the public tenant site. Collects an email
 * for guests (logged-in customers skip the field — JWT carries them),
 * confirms the plan, then POSTs to:
 *
 *   /api/v1/customer-subscriptions/public/subscribe/  { service, customer_email, customer_name }
 *
 * On success → redirects to /my-subscriptions.
 *
 * Payment integration is intentionally NOT here yet; the backend creates
 * the subscription in the 'active' state with empty gateway fields, and
 * the future payment step will hook in alongside this view.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import LayoutRenderer from "../../../LayoutRenderer";
import HyperPayWidget from "@/components/payment/HyperPayWidget";
import { useTenantLang } from "../../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../../contexts/TenantThemeContext";
import { resolveTranslated } from "../../../utils/resolveTranslated";
import { tenantRoutes } from "@/lib/tenantRoutes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function readCustomerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("customer_token");
}

export default function SubscribeClient({ domain, site, header, footer, service }) {
  const router = useRouter();
  const { language: lang, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const billing = service.billing_type; // "monthly" | "yearly"
  const price = Number(service.base_price || 0);
  const currency = service.currency || "SAR";

  const isLoggedIn = !!readCustomerToken();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // When backend returns a HyperPay checkout, we swap the form for the
  // widget. The customer enters card details inside the widget; on
  // submit HyperPay redirects to our callback URL.
  const [checkout, setCheckout] = useState(null);

  const t = (en, ar, ur) => resolveTranslated({ en, ar, ur }, lang);
  const serviceName = resolveTranslated(service.name || service.title, lang);
  const primary = theme?.primary_color || "#3B82F6";

  const periodLabel = billing === "monthly"
    ? t("/month", "/شهر", "/ماہ")
    : t("/year", "/سنة", "/سال");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreed) {
      setError(t("Please agree to the terms before subscribing.",
                 "يرجى الموافقة على الشروط قبل الاشتراك.",
                 "براہ کرم سبسکرائب کرنے سے پہلے شرائط سے اتفاق کریں۔"));
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const headers = { "Content-Type": "application/json", "X-Tenant": domain };
      const customerToken = readCustomerToken();
      if (customerToken) headers["Authorization"] = `Bearer ${customerToken}`;

      const body = isLoggedIn
        ? { service: service.slug || service.id }
        : { service: service.slug || service.id, customer_email: email.trim(), customer_name: name.trim() };

      const successUrl = `${window.location.origin}${tenantRoutes.mySubscriptions()}`;
      const cancelUrl = window.location.href;

      const res = await fetch(
        `${API_BASE}/api/v1/customer-subscriptions/public/subscribe/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ ...body, success_url: successUrl, cancel_url: cancelUrl }),
          credentials: "include",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || String(res.status));
      }

      const data = await res.json();

      // HyperPay path: backend returns { checkout_id, widget_url,
      // brands, callback_url, subscription_id }. Render the widget
      // below the form so the customer enters card details.
      if (data.checkout_id && data.widget_url) {
        setCheckout({
          checkoutId: data.checkout_id,
          widgetUrl: data.widget_url,
          brands: data.brands || ["VISA", "MASTER", "MADA"],
          callbackUrl: data.callback_url,
        });
        return;
      }

      // Dev direct-create fallback: backend returns the subscription
      // object directly. Send the customer straight to the portal.
      router.push(tenantRoutes.mySubscriptions());
    } catch (err) {
      setError(err.message || t("Subscription failed.", "فشل الاشتراك.", "سبسکرپشن ناکام۔"));
    } finally {
      setSubmitting(false);
    }
  }

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}

      <main className="min-h-screen bg-gray-50 py-10">
        <div className={`max-w-3xl mx-auto px-4 ${isRTL ? "rtl" : ""}`}>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t("Subscribe to", "اشترك في", "سبسکرائب کریں")} {serviceName}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t("Review the plan below and confirm to start your subscription.",
               "راجع الخطة أدناه وأكد لبدء اشتراكك.",
               "نیچے دیے گئے پلان کا جائزہ لیں اور سبسکرپشن شروع کرنے کی تصدیق کریں۔")}
          </p>

          <PlanCard
            name={serviceName}
            price={price}
            currency={currency}
            periodLabel={periodLabel}
            billing={billing}
            description={resolveTranslated(service.short_description || service.description, lang)}
            lang={lang}
          />

          {checkout ? (
            <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("Payment details", "تفاصيل الدفع", "ادائیگی کی تفصیلات")}
              </h2>
              <p className="text-sm text-gray-600">
                {t(
                  "Enter your card to authorise the first payment. Renewals will be charged automatically until you cancel.",
                  "أدخل بطاقتك لتفويض الدفعة الأولى. سيتم خصم التجديدات تلقائيًا حتى الإلغاء.",
                  "پہلی ادائیگی کی توثیق کے لیے کارڈ درج کریں۔ منسوخ کرنے تک تجدید خود بخود ہو گی۔",
                )}
              </p>
              <HyperPayWidget
                checkoutId={checkout.checkoutId}
                widgetUrl={checkout.widgetUrl}
                brands={checkout.brands}
                callbackUrl={checkout.callbackUrl}
                lang={lang}
                isRTL={isRTL}
                theme={theme}
              />
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("Customer details", "تفاصيل العميل", "صارف کی تفصیلات")}
            </h2>

            {isLoggedIn ? (
              <p className="text-sm text-gray-600">
                {t("You're signed in — we'll use your account for this subscription.",
                   "أنت مسجل الدخول — سنستخدم حسابك لهذا الاشتراك.",
                   "آپ سائن ان ہیں — ہم اس سبسکرپشن کے لیے آپ کا اکاؤنٹ استعمال کریں گے۔")}
              </p>
            ) : (
              <>
                <Field
                  label={t("Full name (optional)", "الاسم الكامل (اختياري)", "پورا نام (اختیاری)")}
                  type="text"
                  value={name}
                  onChange={setName}
                />
                <Field
                  label={t("Email", "البريد الإلكتروني", "ای میل")}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                />
                <p className="text-xs text-gray-500">
                  {t("We'll send you a sign-in link to manage this subscription later.",
                     "سنرسل لك رابط تسجيل الدخول لإدارة هذا الاشتراك لاحقاً.",
                     "ہم آپ کو بعد میں اس سبسکرپشن کا انتظام کرنے کے لیے ای میل لنک بھیجیں گے۔")}
                </p>
              </>
            )}

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4"
              />
              <span>
                {t("I authorize recurring", "أوافق على الفوترة المتكررة", "میں بار بار بلنگ کی اجازت دیتا ہوں")}{" "}
                {billing === "monthly" ? t("monthly", "شهرياً", "ماہانہ") : t("yearly", "سنوياً", "سالانہ")}{" "}
                {t("billing until I cancel.", "حتى أقوم بالإلغاء.", "جب تک میں منسوخ نہ کروں۔")}
              </span>
            </label>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !agreed || (!isLoggedIn && !email)}
              className="w-full py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              {submitting
                ? t("Subscribing...", "جارٍ الاشتراك...", "سبسکرائب ہو رہا ہے...")
                : t("Confirm subscription", "تأكيد الاشتراك", "سبسکرپشن کی تصدیق کریں")}
            </button>

            <p className="text-center text-xs text-gray-400">
              <Link href={tenantRoutes.service(service.slug)} className="hover:underline">
                ← {t("Back to service details", "العودة لتفاصيل الخدمة", "سروس کی تفصیلات پر واپس")}
              </Link>
            </p>
          </form>
          )}
        </div>
      </main>

      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </>
  );
}

function PlanCard({ name, price, currency, periodLabel, billing, description, lang }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
          {billing === "monthly"
            ? resolveTranslated({ en: "Monthly", ar: "شهري", ur: "ماہانہ" }, lang)
            : resolveTranslated({ en: "Yearly", ar: "سنوي", ur: "سالانہ" }, lang)}
        </span>
      </div>
      {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
      <div className="mt-4">
        <span className="text-3xl font-extrabold text-gray-900">
          {currency} {price.toFixed(2)}
        </span>
        <span className="ml-2 text-gray-500">{periodLabel}</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />
    </label>
  );
}
