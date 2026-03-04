// app/superadmin/layout.js
"use client";

import { SuperAdminProvider } from "@/contexts/Superadmincontext";
import { AppProvider } from "@/contexts/AppContext";

export default function SuperAdminRootLayout({ children }) {
  return (
    <SuperAdminProvider>
      {/* <AppProvider> */}
      <div className="superadmin-layout">{children}</div>
     {/* </AppProvider> */}
    </SuperAdminProvider>
    
  );
}