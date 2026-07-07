"use client";

/**
 * CustomRequestMessageThread
 *
 * Shared message thread component reused by:
 *   - tenant admin: /dashboard/custom-requests/[id]
 *   - provider:    /dashboard/provider/custom-requests/[id]
 *   - customer:    /tenant-site/[domain]/my-requests/[id] (uses its
 *                  own inline thread; this component is dashboard-styled)
 *
 * Props:
 *   messages       — array of CustomRequestMessage from the API
 *   canPost        — boolean; whether the current user can post
 *   allowInfoRequest — provider/admin can send kind=info_request
 *   replyBody / setReplyBody — controlled textarea
 *   replyKind / setReplyKind — "message" | "info_request"
 *   onSend         — () => Promise
 *   sending        — boolean
 *   isRTL, t       — i18n
 */

export default function CustomRequestMessageThread({
  messages,
  canPost,
  allowInfoRequest = false,
  replyBody,
  setReplyBody,
  replyKind,
  setReplyKind,
  onSend,
  sending,
  isRTL,
  t,
}) {
  const tt = (key, fallback) => (t ? t(key) || fallback : fallback);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">
        {tt("customRequests.conversation", "Conversation")}
      </h2>

      {messages.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">
          {tt("customRequests.noMessages", "No messages yet.")}
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mb-4">
          {messages.map((m) => {
            const bg =
              m.author_role === "customer"
                ? "bg-blue-50"
                : m.author_role === "provider"
                  ? "bg-emerald-50"
                  : m.kind === "info_request"
                    ? "bg-amber-50"
                    : "bg-gray-50";
            return (
              <div key={m.id} className={`rounded-lg p-3 ${bg}`}>
                <div className={`flex items-baseline justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs font-semibold text-gray-700">
                    {m.author_name || m.author_email || "—"}
                    {m.author_role && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-500">
                        {m.author_role}
                      </span>
                    )}
                    {m.kind === "info_request" && (
                      <span className="ml-2 text-amber-700 text-[10px] uppercase">
                        needs info
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{m.body}</p>
              </div>
            );
          })}
        </div>
      )}

      {canPost && (
        <div className="space-y-2">
          {allowInfoRequest && (
            <div className={`flex items-center gap-3 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="reply_kind"
                  checked={replyKind === "message"}
                  onChange={() => setReplyKind("message")}
                />
                <span>{tt("customRequests.kindMessage", "Message")}</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="reply_kind"
                  checked={replyKind === "info_request"}
                  onChange={() => setReplyKind("info_request")}
                />
                <span>{tt("customRequests.kindInfoRequest", "Request info")}</span>
              </label>
            </div>
          )}
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            placeholder={tt("customRequests.writeReply", "Write a reply…")}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className={`flex ${isRTL ? "justify-start flex-row-reverse" : "justify-end"}`}>
            <button
              onClick={onSend}
              disabled={sending || !replyBody.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {sending ? (tt("common.sending", "Sending…")) : (tt("common.send", "Send"))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
