"use client";

/**
 * OrderCheckoutClient.js
 * 
 * Client wrapper that fetches the service by slug, then renders OrderCheckout.
 * 
 * Route: /services/[serviceSlug]/order (on tenant subdomain)
 * Internal: /tenant-site/[domain]/services/[serviceSlug]/order
 */

import { useState, useEffect } from "react";
import { useTenantLang } from "../../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../../contexts/TenantThemeContext";
import { resolveTranslated } from "../../../utils/resolveTranslated";
import OrderCheckout from "../../../../modules/OrderCheckout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function OrderCheckoutClient({ domain, tenantId, serviceSlug }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/public-services/`, {
          headers: {
            "Content-Type": "application/json",
            "X-Tenant": domain,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch services");

        const data = await res.json();
        const services = data.services || data.results || data || [];

        const normalize = (v) =>
          v?.toString().toLowerCase().trim().replace(/\s+/g, "-");

        const found = services.find((s) => {
          if (s.slug) return normalize(s.slug) === normalize(serviceSlug);
          return normalize(s.title?.en || s.name) === normalize(serviceSlug);
        });

        if (!found) throw new Error("Service not found");

        // Only allow digital services for order checkout
        const sType = found.service_type || found.order_type;
        if (sType && sType !== "digital") {
          throw new Error("This service does not support orders. Use booking instead.");
        }

        setService(found);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [domain, serviceSlug]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {resolveTranslated(
            { en: "Service Not Available", ar: "الخدمة غير متاحة", ur: "سروس دستیاب نہیں" },
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
            { en: "Back to Home", ar: "العودة للرئيسية", ur: "ہوم پر واپس" },
            language
          )}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <OrderCheckout
        domain={domain}
        service={service}
      />
    </div>
  );
}