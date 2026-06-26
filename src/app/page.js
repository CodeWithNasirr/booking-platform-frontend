// app/page.js
"use client";

import PublicNav from "@/components/layout/PublicNav";
import { LandingHome } from "@/components/landing/LandingHome";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <PublicNav />

      <main className="w-full overflow-x-hidden">
        <LandingHome />
      </main>
    </div>
  );
}