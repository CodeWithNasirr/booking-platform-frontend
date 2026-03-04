// src/hooks/useFeatureGate.js
"use client";

import { usePlan } from "@/contexts/PlanContext";

/**
 * Hook for feature-gated UI logic.
 *
 * Usage:
 *   const analytics = useFeatureGate("analytics");
 *   if (!analytics.allowed) return <UpgradeBanner feature={analytics} />;
 *
 *   const providers = useFeatureGate("max_providers");
 *   if (providers.limitReached) { ... }
 */
export function useFeatureGate(code) {
  const { hasFeature, getLimit, getUsage, planTier, loading } = usePlan();

  const allowed = hasFeature(code);
  const limit = getLimit(code);
  const usageData = getUsage(code);

  const current = usageData?.current ?? 0;
  const unlimited = limit === null;
  const limitReached = !unlimited && current >= (limit || 0);

  return {
    code,
    allowed,
    limit,
    current,
    unlimited,
    limitReached,
    loading,
    planTier,

    // For upgrade prompts
    message: !allowed
      ? `The "${code}" feature requires a plan upgrade.`
      : limitReached
      ? `You've reached the limit of ${limit} for your ${planTier} plan.`
      : null,
  };
}