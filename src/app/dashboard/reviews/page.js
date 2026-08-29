import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import PlanFeatureGate from "@/components/dashboard/PlanFeatureGate";
import ReviewsPage from "./ReviewsPage";

export const metadata = { title: "Reviews | Dashboard" };

// Plan entitlement AND RBAC must both pass — mirrors the backend
// (reviews_ratings feature + tenant membership). Reviews are customer
// feedback, so they ride the customers.view permission.
export default function Page() {
  return (
    <PlanFeatureGate feature="reviews_ratings">
      <TenantPermissionGate permission="customers.view">
        <ReviewsPage />
      </TenantPermissionGate>
    </PlanFeatureGate>
  );
}
