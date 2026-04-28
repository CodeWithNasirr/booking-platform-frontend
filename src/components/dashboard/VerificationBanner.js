// src/components/dashboard/VerificationBanner.js
"use client";

/**
 * VerificationBanner
 *
 * Persistent banner shown on tenant dashboard while not fully verified.
 * Three states:
 *   - In grace period:  amber, friendly reminder
 *   - Grace expired:    red, urgent (some features restricted)
 *   - Documents pending: blue, "we're reviewing"
 *   - Approved:         not shown
 *
 * Usage:
 *   <VerificationBanner activeTenant={activeTenant} />
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, AlertCircle, CheckCircle, FileCheck, ArrowRight, X,
  ShieldCheck,
} from "lucide-react";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function VerificationBanner({ activeTenant, dismissible = true }) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!activeTenant) return;

    // Restore dismissed state from sessionStorage
    const key = `verification_dismissed_${activeTenant}`;
    if (sessionStorage.getItem(key) === "1") {
      setDismissed(true);
    }

    const token = Cookies.get("access_token");
    fetch(`${API}/api/v1/tenant/verification-status/`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-Tenant": activeTenant,
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then(setVerification)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTenant]);

  if (loading || !verification) return null;

  // Don't show if fully verified or admin override
  if (verification.is_fully_verified) return null;

  // Allow dismissal during grace period (user can re-show later)
  if (dismissed && verification.is_in_grace_period) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`verification_dismissed_${activeTenant}`, "1");
  };

  const goToDocuments = () => {
    router.push("/dashboard/settings?tab=business");
  };

  // Determine state
  const hasUploads = (
    verification.documents.commercial_registration ||
    verification.documents.vat_certificate ||
    verification.documents.national_id ||
    verification.documents.bank_letter
  ) || verification.level === "partial";

  // ── Grace expired (urgent) ──
  if (!verification.is_in_grace_period && verification.level !== "verified") {
    return (
      <div className="bg-gradient-to-r from-red-50 via-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-900">Verification required</p>
            <p className="text-xs text-red-700 mt-0.5">
              Your trial verification period has ended. Some features (accepting payments, withdrawing funds) are restricted until you complete document verification.
            </p>
            <button
              onClick={goToDocuments}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Upload Documents Now
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Documents pending review ──
  if (hasUploads && verification.level === "partial") {
    return (
      <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 relative">
        {dismissible && (
          <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded hover:bg-white/60">
            <X className="w-3.5 h-3.5 text-blue-600" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-900">Documents under review</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Our team is reviewing your documents. You can continue using the platform normally — we'll notify you once verification is complete.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={goToDocuments}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                View documents
                <ArrowRight className="w-3 h-3" />
              </button>
              {verification.is_in_grace_period && (
                <span className="text-xs text-blue-600">
                  · {verification.days_remaining_in_grace} day{verification.days_remaining_in_grace !== 1 ? "s" : ""} grace remaining
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── In grace period, no uploads yet ──
  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-4 relative">
      {dismissible && (
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded hover:bg-white/60">
          <X className="w-3.5 h-3.5 text-amber-600" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-amber-900">
              Complete your business verification
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
              {verification.days_remaining_in_grace} day{verification.days_remaining_in_grace !== 1 ? "s" : ""} left
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-0.5">
            Upload your Commercial Registration (CR) and VAT certificate to unlock all platform features. You can keep using the platform during this grace period.
          </p>
          <button
            onClick={goToDocuments}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Upload Documents
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}