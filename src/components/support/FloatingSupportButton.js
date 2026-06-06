// src/components/support/FloatingSupportButton.js
"use client";

/**
 * FloatingSupportButton
 * ─────────────────────────────────────────────────────────
 * Fixed bottom-right button that opens a compact panel with:
 *   • Recent tickets list (default view)
 *   • Create new ticket form
 *   • Chat-style conversation per ticket
 *
 * Integration:
 *   In src/components/dashboard/DashboardLayout.js, AFTER </main>:
 *
 *     import FloatingSupportButton from "@/components/support/FloatingSupportButton";
 *     ...
 *     </main>
 *     <FloatingSupportButton />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import {
  LifeBuoy, X, Plus, ChevronRight, Send,
  Loader2, ArrowLeft, MessageSquare,
} from "lucide-react";
import {
  createTicket, fetchMyTickets,
  fetchTicketMessages, replyToTicket,
} from "@/lib/supportApi";

const M = "#8B1E3F";

const STATUS_DOT = {
  open: "bg-blue-500", in_progress: "bg-amber-500",
  waiting_customer: "bg-violet-500", resolved: "bg-emerald-500", closed: "bg-gray-400",
};

export default function FloatingSupportButton() {
  const { activeTenant } = useApp();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("list");           // list | create | chat
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // chat
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  // create
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const chatEnd = useRef(null);

  // ── load tickets ──
  const load = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const d = await fetchMyTickets(activeTenant, { page_size: 8, sort: "-created_at" });
      setTickets(Array.isArray(d) ? d : d?.results || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [activeTenant]);

  useEffect(() => { if (open) load(); }, [open, load]);

  // ── open chat ──
  async function openChat(t) {
    setActiveTicket(t);
    setView("chat");
    setMsgLoading(true);
    try {
      const d = await fetchTicketMessages(activeTenant, t.id);
      setMessages(Array.isArray(d) ? d : d?.results || []);
    } catch { setMessages([]); }
    setMsgLoading(false);
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  // ── send reply ──
  async function handleReply() {
    if (!reply.trim() || !activeTicket) return;
    setSending(true);
    try {
      await replyToTicket(activeTenant, activeTicket.id, reply);
      setReply("");
      const d = await fetchTicketMessages(activeTenant, activeTicket.id);
      setMessages(Array.isArray(d) ? d : d?.results || []);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch { /* silent */ }
    setSending(false);
  }

  // ── create ticket ──
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) { setError("Fill all required fields."); return; }
    setSubmitting(true);
    setError("");
    try {
      await createTicket(activeTenant, form);
      setForm({ subject: "", description: "", category: "general", priority: "medium" });
      setView("list");
      load();
    } catch (err) { setError(err.message); }
    setSubmitting(false);
  }

  function back() { setView("list"); setActiveTicket(null); }

  const badge = tickets.filter(t => !["closed", "resolved"].includes(t.status)).length;
  const closed = activeTicket?.status === "closed" || activeTicket?.status === "resolved";

  return (
    <>
      {/* ── FLOATING TRIGGER ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-xl
                   flex items-center justify-center text-white
                   hover:scale-105 active:scale-95 transition-all duration-200"
        style={{ background: M }}
        aria-label="Support"
      >
        {open ? <X className="w-5 h-5" /> : <LifeBuoy className="w-6 h-6" />}
        {!open && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {/* ── PANEL ── */}
      {open && (
        <div
          className="fixed bottom-[88px] right-6 z-[60] w-[370px] max-h-[500px]
                     bg-white rounded-2xl shadow-2xl border border-gray-200
                     flex flex-col overflow-hidden animate-[slideUp_.18s_ease-out]"
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between text-white rounded-t-2xl" style={{ background: M }}>
            <div className="flex items-center gap-2">
              {view !== "list" && (
                <button onClick={back} className="p-1 rounded-lg hover:bg-white/20 transition"><ArrowLeft className="w-4 h-4" /></button>
              )}
              <span className="text-sm font-semibold">
                {view === "list" ? "Support" : view === "create" ? "New Ticket" : (activeTicket?.ticket_number || "Chat")}
              </span>
            </div>
            {view === "list" && (
              <button onClick={() => router.push("/dashboard/support")} className="text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100">
                View all
              </button>
            )}
          </div>

          {/* ═══ LIST ═══ */}
          {view === "list" && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <MessageSquare className="w-9 h-9 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No support tickets yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {tickets.map(t => (
                      <button
                        key={t.id}
                        onClick={() => openChat(t)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50/80 transition group"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2 h-2 rounded-full mt-[7px] flex-shrink-0 ${STATUS_DOT[t.status] || "bg-gray-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-900 truncate">{t.subject}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {t.ticket_number} · {t.status?.replace(/_/g, " ")}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => setView("create")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90"
                  style={{ background: M }}
                >
                  <Plus className="w-4 h-4" /> New Ticket
                </button>
              </div>
            </div>
          )}

          {/* ═══ CREATE ═══ */}
          {view === "create" && (
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Subject *</label>
                <input
                  type="text" value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]/30"
                  placeholder="Brief summary of the issue" autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none
                             focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]/30"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white
                           flex items-center justify-center gap-2 transition
                           hover:opacity-90 disabled:opacity-50"
                style={{ background: M }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
            </form>
          )}

          {/* ═══ CHAT ═══ */}
          {view === "chat" && activeTicket && (
            <div className="flex-1 flex flex-col">
              {/* status bar */}
              <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 capitalize">{activeTicket.priority} priority</span>
                <span className="text-[10px] text-gray-500 capitalize">{activeTicket.status?.replace(/_/g, " ")}</span>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {msgLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center py-8">No messages yet</p>
                ) : (
                  messages.map(msg => {
                    const mine = msg.sender_type === "customer";
                    const sys  = msg.sender_type === "system";
                    return (
                      <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 ${
                          sys
                            ? "bg-gray-100 text-gray-500 text-center w-full text-[11px] rounded-xl"
                            : mine
                            ? "text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`} style={mine && !sys ? { background: M } : {}}>
                          {!mine && !sys && (
                            <p className="text-[10px] font-semibold mb-0.5" style={{ color: M }}>{msg.sender_name || "Support"}</p>
                          )}
                          <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className={`text-[9px] mt-1 ${mine ? "text-white/50" : "text-gray-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEnd} />
              </div>

              {/* reply */}
              {!closed ? (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reply} onChange={e => setReply(e.target.value)}
                      placeholder="Type a message…"
                      rows={1}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none
                                 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/20"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    />
                    <button
                      onClick={handleReply} disabled={sending || !reply.trim()}
                      className="p-2.5 rounded-xl text-white disabled:opacity-40 transition hover:opacity-90"
                      style={{ background: M }}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2.5 bg-gray-50 border-t text-center">
                  <p className="text-[11px] text-gray-400">This ticket is {activeTicket.status?.replace(/_/g, " ")}.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}