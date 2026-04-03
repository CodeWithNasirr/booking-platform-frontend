// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import CustomersPage from "./CustomersPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="customers.view">
      <CustomersPage />
    </TenantPermissionGate>
  );
}