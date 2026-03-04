// "use client";
// import { Toaster } from 'react-hot-toast'
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { AppProvider } from "@/contexts/AppContext";

// export default function Layout({ children }) {
//   return <DashboardLayout>
//     {children}
//     <Toaster position="top-right" />
//     </DashboardLayout>;
// }
// app/dashboard/layout.js
"use client";

import { AppProvider } from "@/contexts/AppContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function Layout({ children }) {
  return (
    <AppProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AppProvider>
  );
}
