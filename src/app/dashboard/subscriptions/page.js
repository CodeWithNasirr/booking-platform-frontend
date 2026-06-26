import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import SubscriptionsPage from "./SubscriptionsPage";

export const metadata = { title: "Subscriptions | Dashboard" };

export default function Page() {
  return (
    <TenantPermissionGate permission="subscriptions.view">
      <SubscriptionsPage />
    </TenantPermissionGate>
  );
}
