"use client";

import { useState, useEffect } from "react";

import { useTenantLang } from "../../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../../contexts/TenantThemeContext";

import { resolveTranslated } from "../../../utils/resolveTranslated";

import LayoutRenderer from "../../../LayoutRenderer";

import OrderCheckout from "../../../../modules/order-checkout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function OrderCheckoutClient({
  domain,
  serviceSlug,
  site,
  header,
  footer,
}) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/public-services/${serviceSlug}/`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Tenant": domain,
            },
          }
        );

        if (!res.ok) throw new Error("Service not found");

        const service = await res.json();

        if (
          service.service_type !== "digital" ||
          service.order_type !== "order"
        ) {
          throw new Error(
            "This service does not support orders. Use booking instead."
          );
        }

        setService(service);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (serviceSlug) fetchService();
  }, [domain, serviceSlug]);

  return (
    <>
      {/* Header */}
      {headerSection.length > 0 && (
        <LayoutRenderer
          sections={headerSection}
          language={language}
          site={site}
        />
      )}

      <main className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : ""}`}>
        {loading && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {resolveTranslated(
                {
                  en: "Service Not Available",
                  ar: "الخدمة غير متاحة",
                  ur: "سروس دستیاب نہیں",
                },
                language
              )}
            </h2>

            <p className="text-gray-600 mb-6">{error}</p>

            <a
              href="/"
              className="px-6 py-3 text-white rounded-xl font-semibold inline-block"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {resolveTranslated(
                {
                  en: "Back to Home",
                  ar: "العودة للرئيسية",
                  ur: "ہوم پر واپس",
                },
                language
              )}
            </a>
          </div>
        )}

        {!loading && !error && service && (
          <div className="py-8">
            <OrderCheckout domain={domain} service={service} />
          </div>
        )}
      </main>

      {/* Footer */}
      {footerSection.length > 0 && (
        <LayoutRenderer
          sections={footerSection}
          language={language}
          site={site}
        />
      )}
    </>
  );
}