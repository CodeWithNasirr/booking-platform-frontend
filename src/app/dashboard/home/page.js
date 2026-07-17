"use client";

// Dashboard home CONTENT lives here as a sub-route (mirrors superadmin's
// /superadmin/dashboard). Sub-routes under /dashboard/* render reliably
// after login — the same reason /dashboard/settings works — whereas the
// segment index did not. The index (/dashboard) now just redirects here.

import DashboardHome from "@/components/dashboard/DashboardHome";

export default function DashboardHomePage() {
  return <DashboardHome />;
}
