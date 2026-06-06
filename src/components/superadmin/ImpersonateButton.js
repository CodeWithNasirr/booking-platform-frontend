// src/components/superadmin/ImpersonateButton.js
"use client";

/**
 * ImpersonateButton
 *
 * Drop-in button for tenant detail pages.
 * Starts impersonation session and redirects to tenant dashboard.
 *
 * Usage:
 *   <ImpersonateButton tenantId={tenant.id} tenantName={tenant.name} />
 */
import { COOKIE_OPTIONS } from "@/lib/cookieConfig";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { startImpersonation } from "@/lib/platformApi";
import Cookies from "js-cookie";

export default function ImpersonateButton({ tenantId, tenantName, size = "default" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
        const result =
        await startImpersonation(tenantId);

        console.log(
        "Impersonation started:",
        result
        );

        Cookies.set(
          "impersonation_token",
          result.token,
          COOKIE_OPTIONS
        );

        Cookies.set(
          "impersonation_tenant",
          JSON.stringify({
            id: result.tenant_id,
            name: result.tenant_name,
            owner_email: result.owner_email,
            expires_at: result.expires_at,
          }),
          COOKIE_OPTIONS
        );

        // 🔥 IMPORTANT
        Cookies.set(
        "active_tenant",
        result.tenant_id,
        COOKIE_OPTIONS
        );

        // 🔥 OPEN TENANT
        window.open(
        `http://lvh.me:3000/dashboard`,
        "_blank"
        );

    } catch (e) {
        setError(
        e.message || "Failed to start impersonation"
        );

    } finally {
        setLoading(false);
        setConfirming(false);
    }
    };
  if (confirming) {
    return (
      <div className="inline-flex flex-col gap-2 p-4 rounded-xl border border-amber-200 bg-amber-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-medium text-amber-900">
            Login as <strong>{tenantName}</strong>?
          </p>
        </div>
        <p className="text-xs text-amber-700">
          You will see the dashboard as the tenant owner. Session expires in 2 hours.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#8B1E3F" }}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
            {loading ? "Starting..." : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  const isCompact = size === "compact";

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 transition ${
        isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
      } text-gray-700`}
    >
      <UserCheck className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      Login as Tenant
    </button>
  );
}


// ═══════════════════════════════════════════════════════════════
// IMPERSONATION BANNER — shows at top of dashboard when impersonating
// ═══════════════════════════════════════════════════════════════

/**
 * ImpersonationBanner
 *
 * Add to DashboardLayout.js (or a global layout).
 * Shows when sessionStorage has an impersonation token.
 *
 * Usage:
 *   <ImpersonationBanner />
 */
export function ImpersonationBanner() {
  const [session, setSession] = useState(null);
  const [ending, setEnding] = useState(false);
  const router = useRouter();

  // Check on mount
  useState(() => {
    if (typeof window === "undefined") return;
    const raw = Cookies.get(
        "impersonation_tenant"
      );
    if (raw) {
      try { setSession(JSON.parse(raw)); } catch {}
    }
  });

  if (!session) return null;

  const handleStop = async () => {
    setEnding(true);
    try {
      const token = localStorage.getItem("impersonation_token");
      if (token) {
        const { stopImpersonation } = await import("@/lib/platformApi");
        await stopImpersonation(token);
      }
    } catch {} finally {
      Cookies.remove(
        "impersonation_token",
        COOKIE_OPTIONS
      );

      Cookies.remove(
        "impersonation_tenant",
        COOKIE_OPTIONS
      );
      window.location.href = "/superadmin/tenants";
    }
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4" />
        <span>
          Impersonating <strong>{session.name}</strong> ({session.owner_email})
        </span>
      </div>
      <button
        onClick={handleStop}
        disabled={ending}
        className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-medium text-xs transition disabled:opacity-50"
      >
        {ending ? "Ending..." : "Stop Impersonation"}
      </button>
    </div>
  );
}