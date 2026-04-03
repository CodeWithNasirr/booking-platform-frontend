// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import OrdersPage from "./OrdersPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="orders.view">
      <OrdersPage />
    </TenantPermissionGate>
  );
}