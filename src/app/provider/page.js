import DashboardLayout from '@/components/provider/DashboardLayout';
import DashboardHome from '@/components/provider/DashboardHome';

export const metadata = {
  title: 'Provider Dashboard',
  description: 'Service Provider Panel',
};

export default function ProviderHomePage() {
  return (
    <DashboardLayout pageName="Home">
      <DashboardHome />
    </DashboardLayout>
  );
}