// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import CalendarPage from "./CalendarPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="calendar.view">
      <CalendarPage />
    </TenantPermissionGate>
  );
}