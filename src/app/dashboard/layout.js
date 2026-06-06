// // app/dashboard/layout.js
// "use client";

// import { AppProvider } from "@/contexts/AppContext";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";

// export default function Layout({ children }) {
//   return (
//     <AppProvider>
//       <DashboardLayout>
//         {children}
//       </DashboardLayout>
//     </AppProvider>
//   );
// }

"use client";

import { AppProvider } from "@/contexts/AppContext";
import PlatformGate from "@/components/ui/PlatformGate";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function Layout({ children }) {
  return (
    <PlatformGate>
      <AppProvider>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </AppProvider>
    </PlatformGate>
  );
}