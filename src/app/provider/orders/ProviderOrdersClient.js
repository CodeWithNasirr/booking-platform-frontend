"use client";

/**
 * ProviderOrdersClient.js
 * 
 * Provider-facing order management on the tenant site.
 * Requires provider JWT (from dashboard login or provider login).
 * 
 * Route: /provider/orders (on tenant subdomain)

 */

import { useState, useEffect } from "react";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated } from "../../utils/resolveTranslated";
import ProviderOrdersDashboard from "../../../modules/ProviderOrdersDashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ProviderOrdersClient() {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    // Check for provider token (stored by dashboard login or provider login)
    const savedToken =
      localStorage.getItem("provider_token") ||
      localStorage.getItem("access_token") ||
      getCookie("access_token");

    if (!savedToken) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    // Validate — try to fetch provider orders
    async function validate() {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/orders/?role=provider`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );

        if (!res.ok) throw new Error("Unauthorized");
        setToken(savedToken);
      } catch {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    }

    validate();
  }, [domain]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {resolveTranslated(
            { en: "Provider Login Required", ar: "تسجيل دخول مطلوب", ur: "لاگ ان ضروری ہے" },
            language
          )}
        </h2>
        <p className="text-gray-600 mb-6">
          {resolveTranslated(
            {
              en: "Please log in to your provider account to manage orders.",
              ar: "يرجى تسجيل الدخول إلى حسابك لإدارة الطلبات.",
              ur: "آرڈرز کا انتظام کرنے کے لیے اپنے اکاؤنٹ میں لاگ ان کریں۔",
            },
            language
          )}
        </p>
        <a
          href="/auth/login"
          className="px-6 py-3 text-white rounded-xl font-semibold inline-block"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {resolveTranslated(
            { en: "Log In", ar: "تسجيل الدخول", ur: "لاگ ان" },
            language
          )}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProviderOrdersDashboard
        domain={domain}
        token={token}
      />
    </div>
  );
}

// Helper: read cookie value
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}