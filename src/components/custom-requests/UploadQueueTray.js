"use client";

/**
 * UploadQueueTray
 *
 * Renders the active upload queue as a small set of tiles. Shows
 * a real progress bar driven by XHR upload bytes, lets the user
 * cancel an in-flight upload, retry a failed one, and dismiss
 * finished rows.
 *
 * Image uploads display a local thumbnail (URL.createObjectURL,
 * revoked on row removal). Non-images get the tone-tinted ext
 * badge — same family colours used in AttachmentGrid for visual
 * continuity.
 *
 * Returns null when the queue is empty so hosts can leave the
 * component mounted unconditionally.
 *
 * Auto-fade: pass `autoClearDoneMs` (default 2500) and we'll
 * remove "done" rows after that delay so the tray collapses
 * cleanly once the persisted file lands in AttachmentGrid via
 * realtime.
 */

import { useEffect, useMemo } from "react";
import { Loader2, X, RefreshCcw, CheckCircle2 } from "lucide-react";

function ext(name = "") {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isImage(name) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext(name));
}

function badgeTone(name) {
  const e = ext(name);
  if (e === "pdf")                                  return "bg-rose-50 text-rose-700";
  if (["doc", "docx", "rtf"].includes(e))           return "bg-blue-50 text-blue-700";
  if (["xls", "xlsx", "csv"].includes(e))           return "bg-emerald-50 text-emerald-700";
  if (["zip", "rar", "7z"].includes(e))             return "bg-amber-50 text-amber-700";
  if (["mp4", "mov", "webm", "avi"].includes(e))    return "bg-purple-50 text-purple-700";
  return "bg-gray-50 text-gray-500";
}

function fmtSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u += 1; }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

function ThumbOrBadge({ file }) {
  const previewUrl = useMemo(() => {
    if (!isImage(file.name)) return null;
    try { return URL.createObjectURL(file); }
    catch { return null; }
  }, [file]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  if (previewUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />;
  }
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase ${badgeTone(file.name)}`}>
      {ext(file.name) || "file"}
    </div>
  );
}

export default function UploadQueueTray({
  queue,
  onCancel,
  onRetry,
  onDismiss,
  onClearDone,
  autoClearDoneMs = 2500,
  className = "",
}) {
  // Auto-fade done rows so the tray quietly collapses.
  useEffect(() => {
    if (!queue.some((x) => x.state === "done")) return undefined;
    const t = setTimeout(() => onClearDone?.(), autoClearDoneMs);
    return () => clearTimeout(t);
  }, [queue, onClearDone, autoClearDoneMs]);

  if (!queue || queue.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`} aria-label="Upload queue">
      {queue.map((item) => {
        const pct = Math.round((item.progress || 0) * 100);
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm"
            role="status"
            aria-live={item.state === "error" ? "assertive" : "polite"}
          >
            <ThumbOrBadge file={item.file} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 truncate">{item.file.name}</p>
                <span className="text-[11px] text-gray-400 shrink-0">{fmtSize(item.file.size)}</span>
              </div>

              {/* Progress / status row */}
              {item.state === "uploading" || item.state === "pending" ? (
                <div className="mt-1.5">
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--brand-primary,#3B82F6)] transition-[width]"
                      style={{ width: `${item.state === "pending" ? 4 : pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {item.state === "pending" ? "Queued…" : `${pct}%`}
                  </p>
                </div>
              ) : item.state === "done" ? (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Uploaded
                </p>
              ) : item.state === "error" ? (
                <p className="text-[11px] text-rose-600 mt-1">
                  {item.error || "Upload failed"}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">Cancelled</p>
              )}
            </div>

            {/* Per-row controls */}
            <div className="flex items-center gap-1 shrink-0">
              {(item.state === "uploading" || item.state === "pending") && (
                <button
                  onClick={() => onCancel?.(item.id)}
                  aria-label={`Cancel upload of ${item.file.name}`}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {(item.state === "error" || item.state === "cancelled") && (
                <>
                  <button
                    onClick={() => onRetry?.(item.id)}
                    aria-label={`Retry ${item.file.name}`}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[color:var(--brand-primary,#3B82F6)] hover:bg-[color:var(--brand-primary,#3B82F6)]/10"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDismiss?.(item.id)}
                    aria-label={`Dismiss ${item.file.name}`}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {item.state === "done" && (
                <button
                  onClick={() => onDismiss?.(item.id)}
                  aria-label={`Dismiss ${item.file.name}`}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
