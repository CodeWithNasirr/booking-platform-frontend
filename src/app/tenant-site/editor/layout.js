"use client";

import { AppProvider } from "@/contexts/AppContext";

export default function EditorLayout({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
