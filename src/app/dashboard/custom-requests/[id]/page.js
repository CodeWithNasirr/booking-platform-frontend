import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import CustomRequestDetailPage from "./CustomRequestDetailPage";

export const metadata = { title: "Request Detail | Dashboard" };

export default function Page({ params }) {
  return (
    <TenantPermissionGate permission="custom_requests.view">
      <CustomRequestDetailPage id={params.id} />
    </TenantPermissionGate>
  );
}
