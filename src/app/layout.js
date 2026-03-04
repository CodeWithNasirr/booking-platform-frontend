// // src/app/layout.js

import "../app/globals.css";

import { AppProvider } from "@/contexts/AppContext";
import { SuperAdminProvider } from "@/contexts/Superadmincontext";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* <SuperAdminProvider> */}
          <AppProvider>
            {children}
          </AppProvider>
        {/* </SuperAdminProvider> */}
      </body>
    </html>
  );
}
