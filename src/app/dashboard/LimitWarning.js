// src/components/dashboard/LimitWarning.js
"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

/**
 * Warning bar shown when a resource limit is approaching or reached.
 *
 * Usage:
 *   <LimitWarning
 *     current={9}
 *     limit={10}
 *     resourceName="providers"
 *   />
 */
export default function LimitWarning({ current, limit, resourceName = "items" }) {
  if (limit === null || limit === undefined) return null; // unlimited
  
  const percentage = Math.round((current / limit) * 100);
  const isAtLimit = current >= limit;
  const isNearLimit = percentage >= 80;

  if (!isNearLimit) return null;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        isAtLimit
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className={`w-5 h-5 ${isAtLimit ? "text-red-500" : "text-amber-500"}`}
        />
        <div>
          <p
            className={`text-sm font-medium ${
              isAtLimit ? "text-red-700" : "text-amber-700"
            }`}
          >
            {isAtLimit
              ? `${resourceName} limit reached (${current}/${limit})`
              : `Approaching ${resourceName} limit (${current}/${limit})`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAtLimit
              ? "Upgrade your plan to add more."
              : "Consider upgrading soon."}
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/settings?tab=billing"
        className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
          isAtLimit
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
        } transition`}
      >
        Upgrade
      </Link>
    </div>
  );
}