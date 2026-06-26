import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import CustomRequestsPage from "./CustomRequestsPage";

export const metadata = { title: "Custom Requests | Dashboard" };

export default function Page() {
  return (
    <TenantPermissionGate permission="custom_requests.view">
      <CustomRequestsPage />
    </TenantPermissionGate>
  );
}
