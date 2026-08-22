// src/components/dashboard/PlanFeatureGate.js
"use client";

/**
 * PlanFeatureGate
 *
 * Route/section guard for PLAN feature access — distinct from tenant RBAC
 * (TenantPermissionGate). A capability is visible only when BOTH gates pass:
 * the tenant's PLAN must include the feature AND the user's ROLE must grant the
 * permission. This mirrors the backend, where a view stacks
 * FeaturePermission(<feature>) on top of IsAuthenticatedAndTenantMember.
 *
 * Backend enforcement is the real security boundary; this guard stops a user
 * from landing on a page their plan can't use (and seeing broken API calls).
 *
 * Usage:
 *   <PlanFeatureGate feature="analytics">
 *     <AnalyticsPage />
 *   </PlanFeatureGate>
 *
 *   // Render nothing instead of an upgrade prompt:
 *   <PlanFeatureGate feature="analytics" silent>...</PlanFeatureGate>
 */

import Link from "next/link";
import { Lock } from "lucide-react";
import { usePlan } from "@/contexts/PlanContext";
import { useApp } from "@/contexts/AppContext";

export default function PlanFeatureGate({
  feature,
  fallback,
  silent = false,
  children,
}) {
  const { hasFeature, planName, loading } = usePlan();
  const { t } = useApp();

  // While the plan is loading, don't flash the gated content OR a denial —
  // render nothing for the frame (same policy as the sidebar).
  if (loading) return null;

  if (hasFeature(feature)) return children;

  if (silent) return null;
  if (fallback) return fallback;

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Lock className="w-6 h-6 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">
        {t?.("plan.feature_locked_title") || "Not available on your plan"}
      </h2>
      <p className="text-sm text-gray-500 max-w-sm">
        {t?.("plan.feature_locked_body") ||
          `This feature isn't included in your ${planName || "current"} plan. Upgrade to unlock it.`}
      </p>
      <Link
        href="/dashboard/billing"
        className="mt-2 inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium"
        style={{ backgroundColor: "#800020" }}
      >
        {t?.("plan.view_plans") || "View plans"}
      </Link>
    </div>
  );
}
