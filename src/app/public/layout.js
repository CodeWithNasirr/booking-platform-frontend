"use client";

import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}