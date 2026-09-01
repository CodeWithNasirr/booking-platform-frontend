"use client";

/**
 * AttachmentGrid (V3.F.5)
 *
 * - Image tiles get a subtle "View" overlay on hover so it's
 *   obvious they're tappable.
 * - File size renders under the name when known.
 * - Non-image attachments wear a tone-tinted ext badge keyed
 *   off the extension family (image / pdf / doc / xls / zip /
 *   video / other) so they stay visually distinct on a long
 *   request.
 */

import { Eye } from "lucide-react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

function ext(name = "") {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isImage(name) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext(name));
}

function badgeTone(name) {
  const e = ext(name);
  if (["pdf"].includes(e))                          return "bg-rose-50 text-rose-700";
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
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

export default function AttachmentGrid({ files }) {
  if (!files || files.length === 0) return null;
  return (
    <ul
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      aria-label="Attachments"
    >
      {files.map((f) => {
        const fileUrl = resolveMediaUrl(f.file);
        return (
        <li key={f.id}>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/30"
          >
            {isImage(f.file_name) ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={f.file_name}
                  className="w-full h-28 object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100">
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </span>
              </div>
            ) : (
              <div className={`h-28 flex items-center justify-center text-[11px] font-bold uppercase tracking-wide ${badgeTone(f.file_name)}`}>
                {ext(f.file_name) || "file"}
              </div>
            )}
            <div className="px-2.5 py-1.5 bg-white">
              <p className="text-xs text-gray-700 truncate font-medium">{f.file_name}</p>
              {f.file_size > 0 && (
                <p className="text-[10px] text-gray-400">{fmtSize(f.file_size)}</p>
              )}
            </div>
          </a>
        </li>
        );
      })}
    </ul>
  );
}
