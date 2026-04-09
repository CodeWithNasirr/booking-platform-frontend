"use client";

import Cookies from "js-cookie";
import { useApp } from "@/contexts/AppContext";
import DashboardLayout from "@/components/provider/DashboardLayout";
import ProviderOrdersDashboard from "./ProviderOrdersDashboard";
import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ProviderOrdersClient() {
  const { t, language, activeTenant,tenants } = useApp();

  const tenantId = activeTenant;

  const tenant = tenants?.find(t => t.id === tenantId);
  const theme = tenant?.settings?.branding || {};

  const domain = tenant?.primary_domain?.domain;

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(null);

  useEffect(() => {
    const savedToken = Cookies.get("access_token");
    // console.log("Checking provider auth with token:", savedToken, "and tenant:", tenantId);

    if (!savedToken || !tenantId) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

   async function validate() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/?role=provider`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "X-Tenant": tenantId,
        },
      });

      if (!res.ok) {
        // console.log("Provider validation failed:", res.status);
        setUnauthorized(true);
        return;
      }

      const data = await res.json();
      // console.log("Provider orders response:", data);

      setToken(savedToken);
      setUnauthorized(false); // ✅ IMPORTANT FIX
    } catch (err) {
      // console.error("Provider validation error:", err);
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  }

    validate();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // if (unauthorized === true) {
  //   return (
  //     <DashboardLayout pageName="My Orders">
  //     <div className="max-w-lg mx-auto p-6 text-center">
  //       <div className="text-5xl mb-4">🔒</div>
  //       <h2 className="text-xl font-bold text-gray-900 mb-2">
  //         {t(
  //           { en: "Provider Login Required", ar: "تسجيل دخول مطلوب", ur: "لاگ ان ضروری ہے" },
  //           language
  //         )}
  //       </h2>
  //       <p className="text-gray-600 mb-6">
  //         {t(
  //           {
  //             en: "Please log in to your provider account to manage orders.",
  //             ar: "يرجى تسجيل الدخول إلى حسابك لإدارة الطلبات.",
  //             ur: "آرڈرز کا انتظام کرنے کے لیے اپنے اکاؤنٹ میں لاگ ان کریں۔",
  //           },
  //           language
  //         )}
  //       </p>
  //       <a
  //         href="/auth/login"
  //         className="px-6 py-3 text-white rounded-xl font-semibold inline-block"
  //         style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
  //       >
  //         {t(
  //           { en: "Log In", ar: "تسجيل الدخول", ur: "لاگ ان" },
  //           language
  //         )}
  //       </a>
  //     </div>
  //     </DashboardLayout>
  //   );
  // }

  return (
    <DashboardLayout pageName="My Orders">
    <div className="min-h-screen bg-gray-50 py-8">
     
      <ProviderOrdersDashboard
      />
    </div>
    </DashboardLayout>
  );
}

// Helper: read cookie value
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}