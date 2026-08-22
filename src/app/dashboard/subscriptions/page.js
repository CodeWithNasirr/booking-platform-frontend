import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import PlanFeatureGate from "@/components/dashboard/PlanFeatureGate";
import SubscriptionsPage from "./SubscriptionsPage";

export const metadata = { title: "Subscriptions | Dashboard" };

export default function Page() {
  // Plan entitlement AND RBAC must both pass — mirrors the backend
  // (require_feature("subscription_services") + tenant permission).
  return (
    <PlanFeatureGate feature="subscription_services">
      <TenantPermissionGate permission="subscriptions.view">
        <SubscriptionsPage />
      </TenantPermissionGate>
    </PlanFeatureGate>
  );
}
