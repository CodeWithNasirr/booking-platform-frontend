"use client";

// Mirrors /superadmin/page.js: the segment index is a thin redirect to the
// content sub-route (/dashboard/home). The superadmin panel works after
// login precisely because login lands on a content sub-route, not the
// segment index — this brings the tenant dashboard to the same pattern.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/home");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#8B1E3F]" />
    </div>
  );
}
