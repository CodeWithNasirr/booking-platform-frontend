"use client";

import { useState } from "react";
import { useTenantTheme } from "../contexts/TenantThemeContext";

export default function FileUploadModule({ settings, tenantId, lang }) {
  const theme = useTenantTheme();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const {
    variant = "dropzone",
    max_files = 5,
    allowed_types = ["image/*", "application/pdf"],
    max_size_mb = 10,
  } = settings || {};

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles].slice(0, max_files));
  };

  return (
    <div
      className="border-2 border-dashed rounded-xl p-8 text-center transition-colors hover:border-blue-400"
      style={{ borderColor: files.length > 0 ? theme.primary_color : "#E5E7EB" }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="text-4xl mb-4">📁</div>
      <p className="text-gray-600 mb-2">
        Drag & drop files here, or click to browse
      </p>
      <p className="text-sm text-gray-400">
        Max {max_files} files, up to {max_size_mb}MB each
      </p>
      
      <input
        type="file"
        multiple
        accept={allowed_types.join(",")}
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="mt-4 inline-block px-6 py-2 text-white rounded-lg cursor-pointer"
        style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
      >
        Choose Files
      </label>

      {files.length > 0 && (
        <div className="mt-4 text-left">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-700">{file.name}</span>
              <button
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}