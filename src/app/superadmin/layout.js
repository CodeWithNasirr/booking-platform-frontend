// app/superadmin/layout.js
"use client";

import { SuperAdminProvider } from "@/contexts/Superadmincontext";

export default function SuperAdminRootLayout({ children }) {
  return (
    <SuperAdminProvider>

      <div className="superadmin-layout">{children}</div>

    </SuperAdminProvider>
    
  );
}