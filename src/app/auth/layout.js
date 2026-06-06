// app/auth/layout.js

import { AppProvider } from "@/contexts/AppContext";

export default function AuthLayout({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}