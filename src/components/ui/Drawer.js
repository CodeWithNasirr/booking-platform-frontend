"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Portal from "./Portal";
import IconButton from "./IconButton";

/**
 * Drawer (Sheet) — slide-in panel for filters, details and mobile
 * navigation. Sides use logical direction: "end"/"start" flip
 * automatically in RTL; "bottom" is a mobile sheet.
 *
 *   <Drawer open={open} onClose={close} side="end" title="Filters">
 *     …content…
 *   </Drawer>
 */

function sideClasses(side, isRTL) {
  const physical =
    side === "start" ? (isRTL ? "right" : "left")
    : side === "end" ? (isRTL ? "left" : "right")
    : side; // "bottom"

  switch (physical) {
    case "left":
      return {
        position: "inset-y-0 left-0 h-full w-[88vw] max-w-sm rounded-e-2xl",
        anim: "animate-drawer-left",
      };
    case "right":
      return {
        position: "inset-y-0 right-0 h-full w-[88vw] max-w-sm rounded-s-2xl",
        anim: "animate-drawer-right",
      };
    default: // bottom
      return {
        position: "inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-2xl",
        anim: "animate-drawer-bottom",
      };
  }
}

export default function Drawer({
  open, onClose, side = "end", title, description, children,
  className = "", closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      cancelAnimationFrame(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isRTL =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("dir") === "rtl";
  const { position, anim } = sideClasses(side, isRTL);
  const titleId = title ? "drawer-title" : undefined;
  const descId = description ? "drawer-desc" : undefined;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100]">
        <div
          className="absolute inset-0 bg-black/50 animate-backdrop"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          tabIndex={-1}
          className={`absolute ${position} ${anim} bg-surface text-surface-foreground border border-border shadow-lg overflow-y-auto outline-none flex flex-col ${className}`}
        >
          {(title || onClose) && (
            <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-border">
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </p>
                )}
              </div>
              {onClose && (
                <IconButton
                  label="Close"
                  icon={X}
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="-me-1 -mt-1 shrink-0"
                />
              )}
            </div>
          )}
          <div className="p-5 flex-1">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
