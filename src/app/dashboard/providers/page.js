// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import ProvidersPage from "./ProvidersPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="providers.view">
      <ProvidersPage />
    </TenantPermissionGate>
  );
}