// app/provider/layout.js - Keep this simple or remove if using DashboardLayout
export const metadata = {
  title: 'Provider Dashboard',
  description: 'Service Provider Panel',
};

export default function ProviderLayout({ children }) {
  return children; // DashboardLayout handles the wrapper
}