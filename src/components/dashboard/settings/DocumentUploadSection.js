// src/components/dashboard/settings/DocumentUploadSection.js
"use client";

/**
 * DocumentUploadSection
 *
 * Renders in the tenant Settings page (Business Info tab).
 * Handles business document upload, status display, and deletion.
 *
 * Usage:
 *   <DocumentUploadSection activeTenant={activeTenant} />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, FileText, Check, X, Loader2, AlertCircle,
  Trash2, Download, Eye, Shield, Clock, CheckCircle,
  XCircle, File,
} from "lucide-react";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_CONFIGS = {
  not_uploaded: { icon: Upload,      color: "text-gray-500",   bg: "bg-gray-50",    border: "border-gray-200", label: "No document uploaded" },
  pending:      { icon: Clock,       color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200", label: "Pending Review" },
  approved:     { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Approved" },
  rejected:     { icon: XCircle,     color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200", label: "Rejected" },
};

function getHeaders(tenantId) {
  const token = Cookies.get("access_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Tenant": tenantId,
  };
}

export default function DocumentUploadSection({ activeTenant }) {
  const [docStatus, setDocStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ── Load document status ──
  const loadStatus = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/tenants/documents/status/`, {
        headers: getHeaders(activeTenant),
      });
      const data = await res.json();
      if (res.ok) setDocStatus(data);
      else setError(data.detail || "Failed to load document status");
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Upload handler ──
  const handleUpload = async (file) => {
    if (!file || !activeTenant) return;

    // Client-side validation
    const ext = file.name.split(".").pop().toLowerCase();
    const allowedExts = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
    if (!allowedExts.includes(ext)) {
      setError(`File type .${ext} not allowed. Use: ${allowedExts.join(", ")}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "business_document");

    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const result = await new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.detail || "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid response"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", `${API}/api/v1/tenants/documents/upload/`);
        const token = Cookies.get("access_token");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("X-Tenant", activeTenant);
        xhr.send(formData);
      });

      setUploadProgress(100);
      await loadStatus();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!confirm("Delete this document? You'll need to upload a new one.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/v1/tenants/documents/delete/`, {
        method: "DELETE",
        headers: getHeaders(activeTenant),
      });
      if (res.ok) {
        await loadStatus();
      } else {
        const data = await res.json();
        setError(data.detail || "Delete failed");
      }
    } catch {
      setError("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  // ── Drag & drop ──
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIGS[docStatus?.status] || STATUS_CONFIGS.not_uploaded;
  const StatusIcon = statusConfig.icon;
  const hasDocument = docStatus?.has_document;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Business Document</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload your business license or registration document for verification.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      )}

      {/* Status banner */}
      {hasDocument && (
        <div className={`flex items-center justify-between p-4 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
            <div>
              <p className={`text-sm font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
              {docStatus?.file_name && (
                <p className="text-xs text-gray-500 mt-0.5">{docStatus.file_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {docStatus?.file_url && (
              <a
                href={docStatus.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/60 transition-colors"
                title="View document"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg hover:bg-white/60 text-red-500 transition-colors disabled:opacity-50"
              title="Delete document"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {docStatus?.status === "rejected" && docStatus?.rejection_reason && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-700">{docStatus.rejection_reason}</p>
        </div>
      )}

      {/* Upload area */}
      {!uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragOver
              ? "border-[#8B1E3F] bg-[#8B1E3F]/5"
              : "border-gray-300 hover:border-[#8B1E3F]/40 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
            className="hidden"
          />

          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-[#8B1E3F]" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-gray-700">
            {hasDocument ? "Upload a new document" : "Drop your document here, or click to browse"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPG, PNG, DOC, DOCX — Max 10MB
          </p>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="p-6 rounded-xl border border-[#8B1E3F]/20 bg-[#8B1E3F]/5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
            <span className="text-sm font-medium text-[#8B1E3F]">
              Uploading... {uploadProgress}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8B1E3F] to-[#E85D75] rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}