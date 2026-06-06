"use client";

import { AppProvider } from "@/contexts/AppContext";
import { getDomainType } from "@/lib/domain";

export default function LoginLayout({ children }) {
  const domainType = getDomainType();

  // only tenant gets AppProvider
  if (domainType !== "admin") {
    return (
      <AppProvider>
        {children}
      </AppProvider>
    );
  }

  return children;
}