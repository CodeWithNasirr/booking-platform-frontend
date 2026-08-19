"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Portal from "./Portal";
import IconButton from "./IconButton";

/**
 * Modal — accessible, controlled dialog on shared tokens.
 * Handles ESC to close, backdrop click, body scroll-lock and
 * initial focus. Sizes are responsive and never exceed the
 * viewport on 360px screens.
 *
 *   <Modal open={open} onClose={close} title="Edit service">
 *     …body…
 *     <ModalFooter>…actions…</ModalFooter>
 *   </Modal>
 */

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export default function Modal({
  open, onClose, title, description, children,
  size = "md", closeOnBackdrop = true, className = "",
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // move focus into the panel
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      cancelAnimationFrame(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = title ? "modal-title" : undefined;
  const descId = description ? "modal-desc" : undefined;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className={`relative w-full ${SIZES[size] || SIZES.md} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-surface text-surface-foreground border border-border shadow-lg animate-modal outline-none ${className}`}
        >
          {(title || onClose) && (
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
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
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </Portal>
  );
}

export function ModalFooter({ className = "", children }) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mt-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}
