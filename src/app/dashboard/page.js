"use client";

import DashboardHome from "@/components/dashboard/DashboardHome";
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";

export default function DashboardPage() {
  return (
   <TenantPermissionGate permission="dashboard.view">
    <DashboardHome />;
   </TenantPermissionGate>
   )
  
}