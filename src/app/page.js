"use client";

import PublicNav from "@/components/layout/PublicNav";
import { LandingHome } from "./public/page";

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
 