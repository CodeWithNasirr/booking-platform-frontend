"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useBlockBackNavigation(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    // Push a dummy state so back button hits this instead
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Force stay on the same page
      window.history.pushState(null, "", window.location.href);
      router.replace(window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, router]);
}
