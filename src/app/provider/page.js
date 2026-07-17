"use client";

// Mirrors /superadmin/page.js: thin redirect from the segment index to the
// content sub-route (/provider/home). Login lands on the sub-route, which
// renders reliably after login (same as /provider/orders).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/provider/home");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#f9fafb]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#800020]" />
    </div>
  );
}
