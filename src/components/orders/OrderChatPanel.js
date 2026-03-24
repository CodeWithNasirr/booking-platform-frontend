// src/components/orders/OrderChatPanel.js
"use client";

/**
 * OrderChatPanel — Reusable order messaging + file upload panel
 *
 * Used by both Admin and Provider order detail pages.
 * Accepts authFetch function as prop so it works with any auth pattern.
 *
 * API endpoints used:
 *   GET  /api/v1/orders/{id}/messages/      ← fetch messages
 *   POST /api/v1/orders/{id}/messages/      ← send message
 *   POST /api/v1/orders/{id}/upload_file/   ← upload file
 *
 * Props:
 *   orderId      - Order UUID
 *   tenantId     - Tenant ID for X-Tenant header
 *   authFetch    - (path, tenantId, options) => Promise
 *   initialMessages - Array from order detail (shown immediately while fetch loads)
 *   files        - Array of file objects from order detail
 *   onRefresh    - Callback to reload parent order data
 *   currentUser  - { id, name } to identify "my" messages
 *   readOnly     - If true, hide input (for completed/cancelled)
 */

import { useState, useRef, useEffect, useCallback } from "react";

export default function OrderChatPanel({
  orderId,
  tenantId,
  authFetch,
  initialMessages = [],
  files = [],
  onRefresh,
  currentUser = {},
  readOnly = false,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

 
  // ─── Fetch messages from backend on mount + when orderId changes ───
  const fetchMessages = useCallback(async () => {
    if (!orderId || !tenantId || !authFetch) return;

    try {
      const data = await authFetch(
        `/api/v1/orders/${orderId}/messages/`,
        tenantId
      );
      // Backend returns array of messages
      setMessages(Array.isArray(data) ? data : data?.results || []);
    } catch {
      // Silently fall back to initialMessages — don't block the UI
    }
  }, [orderId, tenantId, authFetch]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Sync initialMessages if parent re-fetches order
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, activeTab]);

  // ─── Send message: POST /orders/{id}/messages/ ───
  const handleSend = useCallback(async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      setError(null);

      const newMsg = await authFetch(
        `/api/v1/orders/${orderId}/messages/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify({ content: messageText.trim() }),
        }
      );

      // Optimistic: append returned message directly
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }

      setMessageText("");
      onRefresh?.();
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }, [messageText, sending, authFetch, orderId, tenantId, onRefresh]);

  // ─── Upload file: POST /orders/{id}/upload_file/ ───
  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "delivery");

        await authFetch(
          `/api/v1/orders/${orderId}/upload_file/`,
          tenantId,
          {
            method: "POST",
            body: formData,
          }
        );

        onRefresh?.();
      } catch (err) {
        setError(err.message || "Failed to upload file.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [authFetch, orderId, tenantId, onRefresh]
  );

  // ─── Key handler ───
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full min-h-[480px] max-h-[calc(100vh-200px)]">
      {/* ── Header with tabs ── */}
      <div className="flex items-center border-b border-gray-100 px-4 py-0 shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "chat"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Messages
          {messages.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "files"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Files
          {files.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {files.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Chat tab ── */}
      {activeTab === "chat" && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-300">
                <div className="text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm">No messages yet</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_type === currentUser.role;
                const isSystem = msg.is_system || msg.is_system_message;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-gray-50 text-gray-400 text-xs px-3 py-1.5 rounded-full italic max-w-[80%] text-center">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[11px] font-semibold mb-0.5 text-gray-500">
                          {msg.sender_name || "User"}
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMe ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100 shrink-0">
              <p className="text-xs text-red-600 flex items-center justify-between">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 font-bold ml-2"
                >
                  ×
                </button>
              </p>
            </div>
          )}

          {/* Input area */}
          {!readOnly && (
            <div className="border-t border-gray-100 p-3 shrink-0">
              <div className="flex items-end gap-2">
                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Attach file"
                >
                  {uploading ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Message input */}
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 max-h-24 placeholder:text-gray-300"
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={sending || !messageText.trim()}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-colors"
                >
                  {sending ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Files tab ── */}
      {activeTab === "files" && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-300">
              <div className="text-center">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm">No files yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.download_url || file.file_url || file.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm shrink-0 group-hover:bg-blue-100">
                    {getFileIcon(file.file_type || file.file_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.file_name || file.original_filename || "File"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {file.category && (
                        <span className="capitalize">{file.category}</span>
                      )}
                      {file.file_size ? ` · ${formatSize(file.file_size)}` : ""}
                      {file.created_at
                        ? ` · ${new Date(file.created_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Upload button in files tab */}
          {!readOnly && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "+ Upload file"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(nameOrType) {
  const s = (nameOrType || "").toLowerCase();
  if (s.includes("pdf")) return "📄";
  if (s.includes("image") || s.includes("png") || s.includes("jpg") || s.includes("jpeg")) return "🖼️";
  if (s.includes("zip") || s.includes("rar")) return "📦";
  if (s.includes("doc") || s.includes("word")) return "📝";
  if (s.includes("xls") || s.includes("sheet")) return "📊";
  if (s.includes("video") || s.includes("mp4")) return "🎬";
  return "📎";
}