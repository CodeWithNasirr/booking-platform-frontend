// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import TenantUsersPage from "./TenantUsersPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="members.view">
      <TenantUsersPage />
    </TenantPermissionGate>
  );
}