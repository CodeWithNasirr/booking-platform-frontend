// // src/app/layout.js

import "../app/globals.css";

import { AppProvider } from "@/contexts/AppContext";
import { SuperAdminProvider } from "@/contexts/Superadmincontext";
import PlatformGate from "@/components/ui/PlatformGate";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* <PlatformGate> */}
          {/* <AppProvider> */}
          
            {children}

          {/* </AppProvider> */}
        {/* </PlatformGate> */}
      </body>
    </html>
  );
}
