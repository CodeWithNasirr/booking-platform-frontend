"use client";

import DashboardHome from "@/components/dashboard/DashboardHome";

/**
 * The dashboard landing page. Access is already gated by DashboardLayout
 * (auth + onboarding + role). It is NOT wrapped in a permission gate: the
 * home screen is the default authenticated landing, and gating it on a
 * `dashboard.view` permission that non-owner roles don't carry made the
 * index render its access-denied state while child routes (which gate on
 * real permissions like `orders.view`) rendered fine.
 */
export default function DashboardPage() {
  return <DashboardHome />;
}
