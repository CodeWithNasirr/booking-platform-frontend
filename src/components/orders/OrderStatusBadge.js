"use client";

import { StatusPill } from "@/components/ui";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "./statusConfig";

export default function OrderStatusBadge({ status, size = "md", className = "" }) {
  if (!status) return null;
  return (
    <StatusPill
      tone={ORDER_STATUS_TONE[status] || "gray"}
      size={size}
      label={ORDER_STATUS_LABEL[status] || status}
      className={className}
    />
  );
}
