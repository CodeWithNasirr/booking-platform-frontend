// src/components/payment/HyperPayWidget.js
"use client";

/**
 * HyperPayWidget
 * ===============
 *
 * Drop-in replacement for Stripe's <Elements> + <PaymentElement>.
 *
 * HyperPay payment flow:
 *   1. Backend creates checkout → returns checkout_id + widget_url
 *   2. This component loads the HyperPay widget JS
 *   3. Customer fills card details inside the widget
 *   4. On submit → HyperPay processes → redirects to shopperResultUrl
 *   5. Our callback page verifies the payment via backend
 *
 * Props:
 *   checkoutId    — from backend initiate_payment response
 *   widgetUrl     — HyperPay JS URL (eu-test or eu-prod)
 *   brands        — ["VISA", "MASTER", "MADA"] (controls which brands show)
 *   callbackUrl   — URL HyperPay redirects to after payment
 *   onReady       — fires when widget is rendered
 *   onError       — fires on widget load error
 *   lang          — "en" | "ar" | "ur"
 *   theme         — tenant theme object (primary_color)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

export default function HyperPayWidget({
  checkoutId,
  widgetUrl,
  brands = ["VISA", "MASTER", "MADA"],
  callbackUrl,
  onReady,
  onError,
  lang = "en",
  isRTL = false,
  theme = {},
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scriptRef = useRef(null);

  const loadWidget = useCallback(() => {
    if (!checkoutId || !widgetUrl) return;

    // Prevent double-loading
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    // Clean container
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    setLoading(true);
    setError(null);

    // Inject the HyperPay widget script
    const script = document.createElement("script");
    script.src = `${widgetUrl}?checkoutId=${checkoutId}`;
    script.async = true;
    script.dataset.brands = brands.join(" ");

    script.onload = () => {
      setLoading(false);
      onReady?.();
    };

    script.onerror = () => {
      const err = "Failed to load payment widget. Please try again.";
      setError(err);
      setLoading(false);
      onError?.(err);
    };

    scriptRef.current = script;
    document.body.appendChild(script);

    // Create the payment form
    if (containerRef.current) {
      const form = document.createElement("form");
      form.action = callbackUrl;
      form.className = "paymentWidgets";
      form.dataset.brands = brands.join(" ");
      containerRef.current.appendChild(form);
    }
  }, [checkoutId, widgetUrl, brands, callbackUrl, onReady, onError]);

  useEffect(() => {
    loadWidget();

    return () => {
      // Cleanup script on unmount
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [loadWidget]);

  const color = theme.primary_color || "#3B82F6";

  return (
    <div className={isRTL ? "rtl" : ""}>
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mb-3"
            style={{ borderColor: `${color}40`, borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-500">
            {resolveTranslated(
              {
                en: "Loading payment form...",
                ar: "جاري تحميل نموذج الدفع...",
                ur: "ادائیگی فارم لوڈ ہو رہا ہے...",
              },
              lang
            )}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
          <p className="text-red-700 font-medium mb-2">{error}</p>
          <button
            onClick={loadWidget}
            className="text-red-600 underline text-sm hover:text-red-800"
          >
            {resolveTranslated(
              { en: "Retry", ar: "إعادة المحاولة", ur: "دوبارہ کوشش کریں" },
              lang
            )}
          </button>
        </div>
      )}

      {/* HyperPay widget renders here */}
      <div
        ref={containerRef}
        className="hyperpay-widget-container"
        style={{ minHeight: loading ? 0 : 200 }}
      />

      {/* Brand badges */}
      {!loading && !error && (
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {brands.map((brand) => (
            <span
              key={brand}
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 rounded border border-gray-200"
            >
              {brand}
            </span>
          ))}
          <span className="text-[10px] text-gray-400 ml-1">
            {resolveTranslated(
              {
                en: "Secured by HyperPay",
                ar: "مؤمّن بواسطة HyperPay",
                ur: "HyperPay کے ذریعے محفوظ",
              },
              lang
            )}
          </span>
        </div>
      )}
    </div>
  );
}