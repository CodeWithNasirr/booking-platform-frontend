import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import PlanFeatureGate from "@/components/dashboard/PlanFeatureGate";
import CustomRequestsPage from "./CustomRequestsPage";

export const metadata = { title: "Custom Requests | Dashboard" };

export default function Page() {
  // Plan entitlement AND RBAC must both pass — mirrors the backend
  // (require_feature("custom_requests") + tenant permission).
  return (
    <PlanFeatureGate feature="custom_requests">
      <TenantPermissionGate permission="custom_requests.view">
        <CustomRequestsPage />
      </TenantPermissionGate>
    </PlanFeatureGate>
  );
}
