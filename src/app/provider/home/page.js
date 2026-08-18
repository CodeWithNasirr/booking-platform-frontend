import DashboardLayout from '@/components/provider/DashboardLayout';
import DashboardHome from '@/components/provider/DashboardHome';

export const metadata = {
  title: 'Provider Dashboard',
  description: 'Service Provider Panel',
};

// Provider home CONTENT as a sub-route (mirrors superadmin's
// /superadmin/dashboard). The /provider index now redirects here so login
// lands on a content sub-route, which renders reliably — same reason
// /provider/orders works.
export default function ProviderHomePage() {
  return (
    <DashboardLayout pageName="Home">
      <DashboardHome />
    </DashboardLayout>
  );
}
