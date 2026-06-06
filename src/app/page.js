// app/page.js
"use client";

import PublicNav from "@/components/layout/PublicNav";
import { LandingHome } from "@/components/landing/LandingHome";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>
        <LandingHome />
      </main>
    </div>
  );
}
 