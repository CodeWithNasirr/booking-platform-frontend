// app/superadmin/dashboard/page.js
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";

export default function SuperAdminDashboardPage() {
  return (
    <SuperAdminLayout
      title="Dashboard"
      description="Welcome to your platform control center"
    >
      <SuperAdminDashboard />
    </SuperAdminLayout>
  );
}