"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The tenant custom-request detail now lives inside the redesigned
 * Custom Requests workspace (list + detail in one screen, driven by
 * ?selected=). This route redirects any deep link (e.g. a
 * notification target_url) into that unified experience so there is a
 * single, consistent detail UI with full realtime, quotes and actions.
 */
export default function CustomRequestDetailPage({ id }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/dashboard/custom-requests?selected=${id}`);
  }, [id, router]);
  return null;
}
