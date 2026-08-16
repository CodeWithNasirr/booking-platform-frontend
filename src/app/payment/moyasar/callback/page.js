"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Moyasar callback forwarder.
 *
 * Moyasar's hosted invoice redirects here (only used as a fallback when the
 * backend BACKEND_URL is not configured; normally Moyasar redirects straight
 * to the backend callback). We forward the customer — with the payment id and
 * routing hints intact — to the backend endpoint, which VERIFIES the real
 * payment status and then redirects to the appropriate success/pending/failed
 * page. The browser's success state is never trusted here.
 */
function MoyasarCallbackInner() {
  const params = useSearchParams();

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const qs = params.toString();
    window.location.replace(`${API}/api/v1/payments/moyasar/callback/${qs ? `?${qs}` : ""}`);
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#8B1E3F]" />
        <p className="text-sm text-gray-500">Confirming your payment…</p>
      </div>
    </div>
  );
}

export default function MoyasarCallbackPage() {
  return (
    <Suspense fallback={null}>
      <MoyasarCallbackInner />
    </Suspense>
  );
}
