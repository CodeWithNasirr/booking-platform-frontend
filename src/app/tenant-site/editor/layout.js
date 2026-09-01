"use client";

import { AppProvider } from "@/contexts/AppContext";
import { PlanProvider } from "@/contexts/PlanContext";

export default function EditorLayout({ children }) {
  return (
    <AppProvider>
      {/* PlanProvider so the editor can gate paid capabilities (e.g. SEO tools)
          using the same plan-enforcement architecture as the dashboard. */}
      <PlanProvider>
        {children}
      </PlanProvider>
    </AppProvider>
  );
}
