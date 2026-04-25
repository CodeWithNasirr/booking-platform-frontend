// /app/dashboard/integrations/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import IntegrationsPage from "./IntegrationsPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="integrations.view">
      <IntegrationsPage />
    </TenantPermissionGate>
  );
}