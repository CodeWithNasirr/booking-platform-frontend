import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import AnalyticsPage from "./AnalyticsPage";
export default function AnalyticsWrapper() {
  return (
    <TenantPermissionGate permission="analytics.view">
      <AnalyticsPage />
    </TenantPermissionGate>
  );
}