"use client";

import { useRef, useState, useEffect } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui";

// Keyboard-safe offset for a viewport-pinned composer. On mobile, the on-screen
// keyboard shrinks the VISUAL viewport but not the layout viewport, so a plain
// `fixed bottom-0` element sits hidden behind the keyboard. We track
// window.visualViewport and lift the composer by the covered height. No-op on
// desktop / where visualViewport is unavailable.
function useKeyboardInset(enabled) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setInset(covered > 40 ? covered : 0); // ignore small UI-chrome deltas
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);
  return inset;
}

/**
 * StickyComposer — text + attachment row. Brand-aware send
 * button (uses --brand-primary). Position controlled by
 * `sticky` so hosts can pin it to either the viewport bottom
 * (customer portal) or the column bottom (CRM right pane).
 *
 * `primary` prop is no longer required — the Button primitive
 * reads the tenant accent from the BrandRoot wrapper. Kept the
 * prop signature backward-compatible by ignoring it.
 */
export default function StickyComposer({
  value, onChange,
  onSend, onAttach,
  sending = false, uploading = false, disabled = false,
  locked = false, lockedMessage = "This request is locked.", onReopen,
  allowKind = false, kind = "message", onKindChange,
  sticky = false,
}) {
  const fileInputRef = useRef(null);
  const keyboardInset = useKeyboardInset(sticky);
  const wrapperClass = sticky
    ? "fixed inset-x-0 bottom-0 border-t bg-white/95 backdrop-blur z-30"
    : "border-t bg-white";
  // Lift above the on-screen keyboard when present; otherwise honor the safe
  // area (iOS home indicator / notch).
  const wrapperStyle = sticky
    ? {
        bottom: keyboardInset ? `${keyboardInset}px` : undefined,
        paddingBottom: keyboardInset ? undefined : "env(safe-area-inset-bottom)",
        transition: "bottom 0.15s ease-out",
      }
    : undefined;

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && !sending && value?.trim()) onSend();
    }
  }

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <div className={sticky ? "max-w-3xl mx-auto p-3 sm:p-4" : "px-4 py-3"}>
        {locked ? (
          <div className="text-sm text-gray-500 text-center py-2">
            {lockedMessage}
            {onReopen && (
              <button
                onClick={onReopen}
                className="ml-3 text-[color:var(--brand-primary,#3B82F6)] hover:underline"
              >
                Reopen
              </button>
            )}
          </div>
        ) : (
          <>
            {allowKind && (
              <div className="flex items-center gap-3 text-xs mb-2">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio" name="composer_kind"
                    checked={kind === "message"}
                    onChange={() => onKindChange?.("message")}
                    className="accent-[color:var(--brand-primary,#3B82F6)]"
                  />
                  Message
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio" name="composer_kind"
                    checked={kind === "info_request"}
                    onChange={() => onKindChange?.("info_request")}
                    className="accent-[color:var(--brand-primary,#3B82F6)]"
                  />
                  Request info
                </label>
              </div>
            )}
            <div className="flex items-end gap-2">
              {onAttach && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.length) onAttach(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || disabled}
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </>
              )}
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Write a reply…"
                aria-label="Reply"
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none max-h-32 focus:border-[color:var(--brand-primary,#3B82F6)] focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/20"
              />
              <Button
                onClick={onSend}
                disabled={disabled || !value?.trim()}
                loading={sending}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
