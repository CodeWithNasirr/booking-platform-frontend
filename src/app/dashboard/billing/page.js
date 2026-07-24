// src/app/dashboard/billing/page.js
"use client";

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import BillingDashboard from "./BillingDashboard";

export default function BillingPage() {
  return (
    <TenantPermissionGate permission="billing.view">
      <BillingDashboard />
    </TenantPermissionGate>
  );
}