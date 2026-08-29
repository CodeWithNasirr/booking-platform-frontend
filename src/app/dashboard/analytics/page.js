import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import PlanFeatureGate from "@/components/dashboard/PlanFeatureGate";
import AnalyticsPage from "./AnalyticsPage";
export default function AnalyticsWrapper() {
  // Two independent gates, mirroring the backend (FeaturePermission("analytics")
  // stacked on IsAuthenticatedAndTenantMember): the PLAN must include analytics
  // AND the ROLE must grant analytics.view.
  return (
    <PlanFeatureGate feature="analytics">
      <TenantPermissionGate permission="analytics.view">
        <AnalyticsPage />
      </TenantPermissionGate>
    </PlanFeatureGate>
  );
}