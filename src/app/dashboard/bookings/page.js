// /app/dashboard/services/page.js

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import BookingsPage from "./BookingsPage";

export default function Page() {
  return (
    <TenantPermissionGate permission="bookings.view">
      <BookingsPage />
    </TenantPermissionGate>
  );
}