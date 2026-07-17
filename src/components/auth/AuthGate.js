"use client";

/**
 * AuthGate — the single authentication + onboarding guard.
 *
 * This is the ONLY component that decides "can this authenticated area
 * render yet?". It replaces the per-layout `roleChecked` copies and the
 * duplicated onboarding guards. Role-based landing (tenant vs provider) is
 * decided ONCE at login, not here.
 *
 * Rules, in order:
 *   1. auth not ready  → full-screen spinner (never a blank `null`).
 *   2. no user         → redirect to /auth/login (render spinner meanwhile).
 *   3. onboarding due   → redirect to onboarding (render spinner meanwhile).
 *   4. otherwise        → render children.
 *
 * Because it always renders a spinner while it is deciding or redirecting,
 * there is no blank screen and no window where a stranded `null` can hang.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";

function FullScreenSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div
        className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--brand-primary,#800020)]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export default function AuthGate({ children }) {
  const router = useRouter();
  const { authReady, user, requiresOnboarding, activeTenantObj } = useApp();

  useEffect(() => {
    if (!authReady) return; // wait for /auth/me to settle
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (requiresOnboarding) {
      const step = activeTenantObj?.onboarding_step || 1;
      router.replace(`/auth/onboarding?step=${step}`);
    }
  }, [authReady, user, requiresOnboarding, activeTenantObj, router]);

  // Render a spinner (not null) whenever we're loading OR mid-redirect.
  if (!authReady || !user || requiresOnboarding) {
    return <FullScreenSpinner />;
  }

  return children;
}
