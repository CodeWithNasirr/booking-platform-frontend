"use client";

/**
 * ChatAttachment — renders a single conversation attachment.
 *
 * Works for booking, order and custom-request chats (they all flow through the
 * same ConversationFeed). Detects media kind from the filename extension (a
 * reliable signal across all three, since order/custom-request file_type is a
 * category, not a MIME) with the MIME as a hint:
 *   image  → inline preview, click opens a lightbox
 *   video  → inline <video controls>
 *   pdf/doc/other → a professional attachment card (icon, name, size, Open)
 *
 * Responsive: images/videos are capped (max-w, max-h, object-contain) so they
 * never overflow a 360px bubble; filenames wrap/truncate; the card is fluid.
 * Security: it only renders the URL the backend already exposes — it never
 * changes file visibility or access rules.
 */

import { useState } from "react";
import { FileText, Download, Play, X } from "lucide-react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

function ext(name = "", url = "") {
  const src = name || url;
  const clean = src.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "heic"];
const VIDEO_EXT = ["mp4", "mov", "webm", "avi", "mkv", "m4v"];

function kindOf(att) {
  const mime = (att.mime || "").toLowerCase();
  const e = ext(att.name, att.url);
  if (mime.startsWith("image/") || IMAGE_EXT.includes(e)) return "image";
  if (mime.startsWith("video/") || VIDEO_EXT.includes(e)) return "video";
  if (mime === "application/pdf" || e === "pdf") return "pdf";
  return "file";
}

function fmtSize(bytes) {
  const b = Number(bytes || 0);
  if (b <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = b, u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u += 1; }
  return `${n.toFixed(n >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

export default function ChatAttachment({ attachment }) {
  const [lightbox, setLightbox] = useState(false);
  if (!attachment) return null;

  const url = resolveMediaUrl(attachment.url);
  const name = attachment.name || "attachment";
  const size = fmtSize(attachment.size);
  const kind = kindOf(attachment);

  if (!url) {
    // No URL yet (e.g. optimistic) — fall back to a minimal card, never a bare
    // "File uploaded".
    return <FileCard name={name} size={size} url="" />;
  }

  if (kind === "image") {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block max-w-[240px] rounded-xl overflow-hidden border border-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#8B1E3F)]/40"
          aria-label={`Open image ${name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            loading="lazy"
            className="w-full max-h-[240px] object-contain bg-gray-50"
          />
        </button>
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              onClick={() => setLightbox(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  if (kind === "video") {
    return (
      <video
        controls
        preload="metadata"
        className="max-w-[280px] max-h-[260px] rounded-xl bg-black/5"
      >
        <source src={url} />
        {/* Fallback link if the browser can't play it */}
      </video>
    );
  }

  // pdf / doc / other → attachment card
  return <FileCard name={name} size={size} url={url} isPdf={kind === "pdf"} />;
}

function FileCard({ name, size, url, isPdf }) {
  return (
    <div className="flex items-center gap-3 max-w-[280px] rounded-xl border border-gray-200 bg-white p-2.5">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isPdf ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"}`}>
        <FileText className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 truncate" title={name}>{name}</div>
        {size ? <div className="text-[11px] text-gray-400">{size}</div> : null}
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
          aria-label={`Download ${name}`}
        >
          <Download className="w-4 h-4" />
        </a>
      ) : null}
    </div>
  );
}
