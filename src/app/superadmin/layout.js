// app/superadmin/layout.js
"use client";

import { SuperAdminProvider } from "@/contexts/Superadmincontext";
import { PlatformNotificationsProvider } from "@/contexts/NotificationsContext";

export default function SuperAdminRootLayout({ children }) {
  return (
    <SuperAdminProvider>
      <PlatformNotificationsProvider>
        <div className="superadmin-layout">{children}</div>
      </PlatformNotificationsProvider>
    </SuperAdminProvider>
  );
}