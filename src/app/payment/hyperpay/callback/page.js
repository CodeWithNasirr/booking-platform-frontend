// src/app/payment/hyperpay/callback/page.js
/**
 * HyperPay Payment Callback Page
 * ================================
 *
 * After the customer pays via HyperPay widget, HyperPay redirects here.
 * This page:
 *   1. Reads the checkout ID from query params
 *   2. Calls backend to verify payment status
 *   3. Redirects to success or failure page
 *
 * URL: /payment/hyperpay/callback?id=<checkout_id>&resourcePath=...
 *
 * The backend's hyperpay_callback view also handles this via server redirect,
 * but this client-side page is the fallback for SPA-style navigation.
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HyperPayCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkoutId = searchParams.get("id");
    const type = searchParams.get("type") || ""; // booking | order | subscription
    const ref = searchParams.get("ref") || "";

    if (!checkoutId) {
      setStatus("failed");
      setError("Missing payment reference.");
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/payments/hyperpay/status/${checkoutId}/`,
          {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const data = await res.json();

        if (data.success) {
          setStatus("success");

          // Redirect to the appropriate success page
          setTimeout(() => {
            if (type === "booking") {
              router.push(`/booking/success?ref=${ref}`);
            } else if (type === "order") {
              router.push(`/order/success?ref=${ref}`);
            } else if (type === "subscription") {
              router.push("/dashboard/billing?checkout=success");
            } else {
              router.push("/payment/success");
            }
          }, 1500);
        } else if (data.pending) {
          setStatus("verifying");
          // Poll again after 3 seconds
          setTimeout(verifyPayment, 3000);
        } else {
          setStatus("failed");
          setError(data.result_description || "Payment was not successful.");
        }
      } catch (e) {
        setStatus("failed");
        setError("Could not verify payment. Please contact support.");
      }
    }

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#8B1E3F] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verifying Payment...
            </h2>
            <p className="text-gray-500 text-sm">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-500 text-sm">Redirecting you now...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✕</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Go Back & Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}