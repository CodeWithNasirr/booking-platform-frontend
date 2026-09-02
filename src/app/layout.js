// src/app/layout.js

import "../app/globals.css";
import DirectionSync from "@/components/ui/DirectionSync";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  // Default to LTR/English for static rendering; DirectionSync applies
  // the persisted language's direction on the client after hydration,
  // and @/lib/t keeps it in sync on subsequent language switches.
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <DirectionSync />
        {children}
        <Toaster position="top-right" />
        
      </body>
    </html>
  );
}
