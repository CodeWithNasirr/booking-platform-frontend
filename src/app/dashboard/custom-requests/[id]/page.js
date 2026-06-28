import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import CustomRequestDetailPage from "./CustomRequestDetailPage";

export const metadata = { title: "Request Detail | Dashboard" };

export default async function Page({ params }) {
<<<<<<< HEAD
  const { id } = await params;
=======
  const {id} = await params
>>>>>>> claude-work
  return (
    <TenantPermissionGate permission="custom_requests.view">
      <CustomRequestDetailPage id={id} />
    </TenantPermissionGate>
  );
}
