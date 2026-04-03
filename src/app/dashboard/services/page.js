// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import ServicesPage from "./ServicesPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="services.view">
      <ServicesPage />
    </TenantPermissionGate>
  );
}