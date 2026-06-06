// src/components/dashboard/settings/DocumentUploadSection.js
"use client";

/**
 * DocumentUploadSection (Multi-document, Saudi Arabia)
 *
 * Lists uploaded documents and lets tenant upload new ones.
 * Each document has type (CR, VAT, ID, Bank Letter, etc.).
 *
 * Usage:
 *   <DocumentUploadSection activeTenant={activeTenant} />
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, FileText, Check, X, Loader2, AlertCircle,
  Trash2, Eye, Clock, CheckCircle, XCircle, Plus, Calendar,
  FileCheck, ChevronRight,
} from "lucide-react";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const MAROON = "#8B1E3F";

const STATUS_CONFIGS = {
  pending:  { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending Review", label_ar: "قيد المراجعة" },
  approved: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Approved", label_ar: "مقبول" },
  rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Rejected", label_ar: "مرفوض" },
  expired:  { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200", label: "Expired", label_ar: "منتهي" },
};

function getHeaders(tenantId) {
  const token = Cookies.get("access_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Tenant": tenantId,
  };
}

export default function DocumentUploadSection({ activeTenant }) {
  const [documents, setDocuments] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [docsRes, typesRes, verifRes] = await Promise.all([
        fetch(`${API}/api/v1/tenants/documents/`, { headers: getHeaders(activeTenant) }),
        fetch(`${API}/api/v1/tenants/document-types/`, { headers: getHeaders(activeTenant) }),
        fetch(`${API}/api/v1/tenants/verification-status/`, { headers: getHeaders(activeTenant) }),
      ]);
      if (docsRes.ok) {
        const d = await docsRes.json();
        setDocuments(d.results || []);
      }
      if (typesRes.ok) {
        const t = await typesRes.json();
        setDocTypes(t.types || []);
      }
      if (verifRes.ok) {
        const v = await verifRes.json();
        setVerification(v);
      }
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async (doc) => {
    if (!confirm(`Delete ${doc.document_type_display}?`)) return;
    try {
      const res = await fetch(`${API}/api/v1/tenants/documents/${doc.id}/`, {
        method: "DELETE",
        headers: getHeaders(activeTenant),
      });
      if (res.ok) {
        loadAll();
      } else {
        const data = await res.json();
        setError(data.detail || "Delete failed");
      }
    } catch {
      setError("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Business Verification Documents</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload your business documents for verification (Saudi Arabia)
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: MAROON }}
        >
          <Plus className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Verification status banner */}
      {verification && <VerificationStatusBanner verification={verification} />}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="p-1"><X className="w-3.5 h-3.5 text-red-500" /></button>
        </div>
      )}

      {/* Required types checklist */}
      {docTypes.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-semibold text-blue-900 mb-2">Recommended Documents:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {docTypes
              .filter(t => t.required)
              .map(t => {
                const uploaded = documents.find(d => d.document_type === t.key);
                return (
                  <div key={t.key} className="flex items-center gap-2 text-sm">
                    {uploaded?.status === "approved" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : uploaded ? (
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{t.label}</span>
                    {t.label_ar && (
                      <span className="text-xs text-gray-400" dir="rtl">{t.label_ar}</span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-700">No documents uploaded yet</p>
          <p className="text-xs text-gray-500 mt-1">Click Upload to add your first document</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <DocumentRow key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          activeTenant={activeTenant}
          docTypes={docTypes}
          existingDocs={documents}
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => { setShowUploadModal(false); loadAll(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VERIFICATION STATUS BANNER
// ═══════════════════════════════════════════════════════════════

function VerificationStatusBanner({ verification }) {
  const { level, is_in_grace_period, days_remaining_in_grace, can_accept_payments, admin_override,missing_documents  } = verification;

  if (admin_override) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Verification Override Active</p>
          <p className="text-xs text-emerald-700 mt-0.5">Admin has approved your account manually.</p>
        </div>
      </div>
    );
  }

  if (level === "verified") {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Fully Verified ✓</p>
          <p className="text-xs text-emerald-700 mt-0.5">Your account is fully verified and can accept all payments.</p>
        </div>
      </div>
    );
  }

  if (is_in_grace_period) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Grace Period: {days_remaining_in_grace} day{days_remaining_in_grace !== 1 ? "s" : ""} remaining
          </p>
         <p className="text-xs text-amber-700 mt-0.5">
          Please upload the following required document(s):
        </p>

        <ul className="mt-1 text-xs text-amber-800 list-disc list-inside">
          {missing_documents?.map((doc, i) => (
            <li key={i}>{doc}</li>
          ))}
        </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-900">Verification Required</p>
        <p className="text-xs text-red-700 mt-0.5">
          Your grace period has ended. {can_accept_payments ? "" : "Some features are now restricted until you complete verification."}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT ROW
// ═══════════════════════════════════════════════════════════════

function DocumentRow({ doc, onDelete }) {
  const sc = STATUS_CONFIGS[doc.status] || STATUS_CONFIGS.pending;
  const Icon = sc.icon;
  const canDelete = doc.status === "pending";
 
  return (
    <div className={`p-4 rounded-xl border ${sc.border} ${sc.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-gray-900">{doc.document_type_display}</h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.color} border ${sc.border}`}>
                <Icon className="w-3 h-3" />
                {sc.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.file_name}</p>
            {doc.document_number && (
              <p className="text-xs text-gray-600 mt-1">
                <span className="text-gray-400">No.</span> <code className="font-mono">{doc.document_number}</code>
              </p>
            )}
            {doc.expiry_date && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
              </p>
            )}
            {doc.status === "rejected" && doc.rejection_reason && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                <strong>Rejected:</strong> {doc.rejection_reason}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {doc.file_url && (
           <a
            href={`http://127.0.0.1:8000${doc.file_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/60 transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </a>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(doc)}
              className="p-2 rounded-lg hover:bg-white/60 text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD MODAL
// ═══════════════════════════════════════════════════════════════

function UploadModal({ activeTenant, docTypes, existingDocs, onClose, onUploaded }) {
  const [docType, setDocType] = useState("commercial_registration");
  const [file, setFile] = useState(null);
  const [docNumber, setDocNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const selectedTypeMeta = docTypes.find(t => t.key === docType);
  const requiredFields = selectedTypeMeta?.fields || [];

  // Check if type already has a non-rejected upload
  const existingDoc = existingDocs.find(
    d => d.document_type === docType && d.status !== "rejected"
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  };

  const selectFile = (f) => {
    const allowedExts = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
    const ext = f.name.split(".").pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      setError(`File type .${ext} not allowed`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB");
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);
    if (docNumber) formData.append("document_number", docNumber);
    if (issueDate) formData.append("issue_date", issueDate);
    if (expiryDate) formData.append("expiry_date", expiryDate);
    if (issuingAuthority) formData.append("issuing_authority", issuingAuthority);

    try {
      const xhr = new XMLHttpRequest();
      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.detail || "Upload failed"));
          } catch {
            reject(new Error("Invalid response"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", `${API}/api/v1/tenants/documents/`);
        const token = Cookies.get("access_token");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("X-Tenant", activeTenant);
        xhr.send(formData);
      });
      onUploaded();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 bg-white"
            >
              {docTypes.map(t => (
                <option key={t.key} value={t.key}>
                  {t.label} {t.label_ar && `· ${t.label_ar}`}
                </option>
              ))}
            </select>
            {selectedTypeMeta?.description && (
              <p className="text-xs text-gray-500 mt-1">{selectedTypeMeta.description}</p>
            )}
          </div>

          {existingDoc && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Note:</strong> You already have a {existingDoc.status} {selectedTypeMeta?.label}. Uploading a new one will not replace it automatically.
            </div>
          )}

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File</label>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative ${file ? "cursor-default" : "cursor-pointer"} rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                dragOver ? "border-[#8B1E3F] bg-[#8B1E3F]/5" :
                file ? "border-emerald-300 bg-emerald-50" : "border-gray-300 hover:border-[#8B1E3F]/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) selectFile(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-emerald-900 truncate">{file.name}</p>
                      <p className="text-xs text-emerald-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-1 rounded hover:bg-white/60">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC, DOCX — Max 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* SA-specific fields */}
          {requiredFields.includes("document_number") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Number</label>
              <input
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
                placeholder="e.g. 1010012345"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {requiredFields.includes("issue_date") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            )}
            {requiredFields.includes("expiry_date") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            )}
          </div>

          {requiredFields.includes("issuing_authority") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issuing Authority</label>
              <input
                value={issuingAuthority}
                onChange={e => setIssuingAuthority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                placeholder="e.g. Saudi Ministry of Commerce"
              />
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="p-3 bg-[#8B1E3F]/5 border border-[#8B1E3F]/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#8B1E3F]" />
                <span className="text-sm font-medium text-[#8B1E3F]">Uploading {progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#8B1E3F] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: MAROON }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Document
          </button>
        </div>
      </div>
    </div>
  );
}