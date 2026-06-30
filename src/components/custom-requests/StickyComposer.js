"use client";

import { useRef } from "react";
import { Paperclip, Send } from "lucide-react";

/**
 * StickyComposer — text + attachment row, optionally pinned to
 * the viewport bottom (customer portal) or to the parent column
 * (CRM right pane). The host controls layout via the `sticky`
 * boolean; the contents are identical.
 *
 * Props:
 *   value, onChange — controlled text
 *   onSend          — () => Promise<void>
 *   onAttach        — (FileList) => Promise<void>
 *   sending, uploading, disabled
 *   locked, lockedMessage, onReopen — render a locked notice
 *   primary         — accent colour
 *   allowKind       — show the kind radio (message / info_request)
 *   kind, onKindChange
 *   sticky          — true to fix to the viewport bottom
 */
export default function StickyComposer({
  value, onChange,
  onSend, onAttach,
  sending = false, uploading = false, disabled = false,
  locked = false, lockedMessage = "This request is locked.", onReopen,
  primary = "#3B82F6",
  allowKind = false, kind = "message", onKindChange,
  sticky = false,
}) {
  const fileInputRef = useRef(null);
  const wrapperClass = sticky
    ? "fixed inset-x-0 bottom-0 border-t bg-white/95 backdrop-blur"
    : "border-t bg-white";
  const wrapperStyle = sticky
    ? { paddingBottom: "env(safe-area-inset-bottom)" }
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
                className="ml-3 text-blue-600 hover:underline"
              >
                Reopen
              </button>
            )}
          </div>
        ) : (
          <>
            {allowKind && (
              <div className="flex items-center gap-3 text-xs mb-2">
                <label className="flex items-center gap-1">
                  <input
                    type="radio" name="composer_kind"
                    checked={kind === "message"}
                    onChange={() => onKindChange?.("message")}
                  />
                  Message
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio" name="composer_kind"
                    checked={kind === "info_request"}
                    onChange={() => onKindChange?.("info_request")}
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || disabled}
                    aria-label="Attach file"
                    className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </>
              )}
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Write a reply…"
                aria-label="Reply"
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 max-h-32"
              />
              <button
                onClick={onSend}
                disabled={sending || disabled || !value?.trim()}
                aria-label="Send"
                className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50 inline-flex items-center gap-1"
                style={{ backgroundColor: primary }}
              >
                {sending ? "…" : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
