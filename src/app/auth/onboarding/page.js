"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import OnboardingWizard from "./OnboardingWizard";

export default function OnboardingPage() {
  const { user, loadingUser, tenants, activeTenant, requiresOnboarding } = useApp();
  const router = useRouter();
  const safeTenants = tenants || [];

  const activeTenantObj = safeTenants.find(
  (t) => t.id === activeTenant
  );
 


  useEffect(() => {
    if (loadingUser) return;

    // Not logged in
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // No tenants yet → onboarding
    if (safeTenants.length === 0) return;

    // No active tenant selected
    if (!activeTenant) {
      router.replace("/tenants/select");
      return;
    }

    // Get active tenant object
    const tenant = safeTenants.find(t => t.id === activeTenant);

    if (!tenant) return;

    // ✅ Onboarding completed → DASHBOARD
    if (tenant.onboarding_completed === true) {
      router.replace("/dashboard");
      return;
    }

      // ❗ Otherwise stay on onboarding
  }, [user, loadingUser, safeTenants, activeTenant]);


  if (loadingUser) return <div>Loading...</div>;

  return <OnboardingWizard tenant={activeTenantObj} />;
}