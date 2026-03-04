"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/superadmin/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#8B1E3F]" />
    </div>
  );
}