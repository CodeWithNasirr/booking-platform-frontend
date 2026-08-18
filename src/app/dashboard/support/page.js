// // src/app/dashboard/support/page.js
// src/app/dashboard/support/page.js
"use client";

import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
/**
 * Full Support Page — Tenant Side
 * ─────────────────────────────────────────────────────
 * Split-pane layout:
 *   LEFT  → ticket list (filtered, searchable)
 *   RIGHT → chat-style conversation thread
 *
 * On mobile: single-column with back navigation.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  Search, Plus, Send, Loader2, X, ArrowLeft,
  MessageSquare, Clock, Filter, ChevronDown,
  Paperclip, Download, File as FileIcon,
} from "lucide-react";
import {
  createTicket, fetchMyTickets,
  fetchTicketDetail, fetchTicketMessages, replyToTicket, closeMyTicket,
} from "@/lib/supportApi";

const M = "#8B1E3F";

const STATUS = {
  open:              { labelKey: "support.status.open",          dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  in_progress:       { labelKey: "support.status.inProgress",   dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
  waiting_customer:  { labelKey: "support.status.awaitingReply", dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-700" },
  resolved:          { labelKey: "support.status.resolved",      dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  closed:            { labelKey: "support.status.closed",        dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600" },
};

const PRIORITY_PILL = {
  low: "bg-gray-100 text-gray-600", medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700", urgent: "bg-red-50 text-red-700",
};

const PRIORITY_LABEL_KEYS = {
  low: "support.priority.low",
  medium: "support.priority.medium",
  high: "support.priority.high",
  urgent: "support.priority.urgent",
};

const CATEGORY_OPTIONS = [
  { value: "general", labelKey: "support.category.general" },
  { value: "technical", labelKey: "support.category.technical" },
  { value: "billing", labelKey: "support.category.billing" },
  { value: "bug", labelKey: "support.category.bug" },
  { value: "feature_request", labelKey: "support.category.featureRequest" },
];

function SupportPageInner() {
  const { activeTenant, t } = useApp();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // conversation
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoad, setMsgLoad] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const endRef = useRef(null);

  // ── load ──
  const load = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const p = {};
      if (statusFilter !== "all") p.status = statusFilter;
      if (search) p.search = search;
      const d = await fetchMyTickets(activeTenant, p);
      setTickets(Array.isArray(d) ? d : d?.results || []);
    } catch { setTickets([]); }
    setLoading(false);
  }, [activeTenant, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  // ── select ticket ──
  async function select(ticket) {
    setActive(ticket);
    setMsgLoad(true);
    try {
      const [det, msgs] = await Promise.all([
        fetchTicketDetail(activeTenant, ticket.id),
        fetchTicketMessages(activeTenant, ticket.id),
      ]);
      setActive(det);
      setMessages(Array.isArray(msgs) ? msgs : msgs?.results || []);
    } catch { setMessages([]); }
    setMsgLoad(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  // ── reply ──
  async function handleReply() {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await replyToTicket(activeTenant, active.id, reply);
      setReply("");
      const d = await fetchTicketMessages(activeTenant, active.id);
      setMessages(Array.isArray(d) ? d : d?.results || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch { /* silent */ }
    setSending(false);
  }

  // ── create ──
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) { 
      setCreateErr(t("support.create.validation.required")); 
      return; 
    }
    setCreating(true);
    setCreateErr("");
    try {
      const ticket = await createTicket(activeTenant, form);
      setForm({ subject: "", description: "", category: "general", priority: "medium" });
      setShowCreate(false);
      load();
      if (ticket?.id) select(ticket);
    } catch (err) { setCreateErr(err.message); }
    setCreating(false);
  }

  const isClosed = active?.status === "closed" || active?.status === "resolved";
  const sc = active ? (STATUS[active.status] || STATUS.open) : null;

  const statusFilters = ["all", "open", "in_progress", "waiting_customer", "resolved", "closed"];

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ════════════════ LEFT: TICKET LIST ════════════════ */}
      <div className={`${active ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[360px] lg:min-w-[360px] border-r border-gray-100`}>
        {/* header */}
        <div className="px-4 pt-4 pb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{t("support.title")}</h2>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: M }}>
              <Plus className="w-3.5 h-3.5" /> {t("support.newTicket")}
            </button>
          </div>
          {/* search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("support.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15" />
          </div>
          {/* filter pills */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {statusFilters.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-[5px] rounded-full text-[10px] font-semibold whitespace-nowrap transition ${
                  statusFilter === s ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={statusFilter === s ? { background: M } : {}}>
                {s === "all" ? t("support.filter.all") : t(STATUS[s]?.labelKey || s)}
              </button>
            ))}
          </div>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 px-6">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">{t("support.empty.noTickets")}</p>
            </div>
          ) : (
            tickets.map(ticket => {
              const s = STATUS[ticket.status] || STATUS.open;
              const isActive = active?.id === ticket.id;
              return (
                <button key={ticket.id} onClick={() => select(ticket)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition group ${
                    isActive ? "bg-rose-50/60 border-l-[3px]" : "hover:bg-gray-50/60"
                  }`}
                  style={isActive ? { borderLeftColor: M } : {}}>
                  <div className="flex items-start gap-2.5">
                    <span className={`w-[7px] h-[7px] rounded-full mt-[7px] flex-shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-mono text-gray-400">{ticket.ticket_number}</span>
                        <span className={`px-1.5 py-[1px] rounded text-[9px] font-semibold ${PRIORITY_PILL[ticket.priority]}`}>
                          {t(PRIORITY_LABEL_KEYS[ticket.priority] || ticket.priority)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(ticket.created_at).toLocaleDateString()}
                        {ticket.message_count > 0 && ` · ${ticket.message_count} ${t("support.msgs")}`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ════════════════ RIGHT: CONVERSATION ════════════════ */}
      <div className={`${active ? "flex" : "hidden lg:flex"} flex-col flex-1 min-w-0`}>
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageSquare className="w-14 h-14 mb-3" />
            <p className="text-sm font-medium text-gray-400">{t("support.empty.selectTicket")}</p>
            <p className="text-xs text-gray-300 mt-1">{t("support.empty.orCreate")}</p>
          </div>
        ) : (
          <>
            {/* ticket header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setActive(null)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{active.subject}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono text-gray-400">{active.ticket_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-semibold ${sc.pill}`}>
                      <span className={`w-[5px] h-[5px] rounded-full ${sc.dot}`} />
                      {t(sc.labelKey)}
                    </span>
                    <span className={`px-1.5 py-[1px] rounded text-[9px] font-semibold ${PRIORITY_PILL[active.priority]}`}>
                      {t(PRIORITY_LABEL_KEYS[active.priority] || active.priority)}
                    </span>
                    {active.category && (
                      <span className="text-[10px] text-gray-400 capitalize">{t(`support.category.${active.category}`) || active.category?.replace(/_/g, " ")}</span>
                    )}
                  </div>
                </div>
              </div>

              {!isClosed && (
                <button
                  onClick={async () => { 
                    await closeMyTicket(activeTenant, active.id); 
                    const d = await fetchTicketDetail(activeTenant, active.id); 
                    setActive(d); 
                    load(); 
                  }}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition flex-shrink-0"
                >
                  {t("support.closeTicket")}
                </button>
              )}
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {/* initial description */}
              {active.description && (
                <div className="bg-gray-50 rounded-xl p-4 mb-2">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("support.originalDescription")}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{active.description}</p>
                </div>
              )}

              {msgLoad ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : (
                messages.map(msg => {
                  const mine = msg.sender_type === "customer";
                  const sys  = msg.sender_type === "system";
                  return (
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        sys
                          ? "bg-gray-50 text-gray-500 text-center w-full text-[11px] rounded-xl italic"
                          : mine
                          ? "text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`} style={mine && !sys ? { background: M } : {}}>
                        {!mine && !sys && (
                          <p className="text-[10px] font-bold mb-0.5" style={{ color: M }}>{msg.sender_name || t("support.supportTeam")}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* attachments */}
                        {msg.attachments?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, i) => (
                              <a key={i} href={att.url} target="_blank" rel="noopener"
                                className={`flex items-center gap-1.5 text-[11px] underline underline-offset-2 ${
                                  mine ? "text-white/80" : "text-blue-600"
                                }`}>
                                <FileIcon className="w-3 h-3" /> {att.filename || `${t("support.attachment")} ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        )}

                        <p className={`text-[10px] mt-1.5 ${mine ? "text-white/40" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* reply */}
            {!isClosed ? (
              <div className="px-5 py-3.5 border-t border-gray-100">
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 relative">
                    <textarea
                      value={reply} onChange={e => setReply(e.target.value)}
                      placeholder={t("support.replyPlaceholder")}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none
                                 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15 pr-10"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    />
                  </div>
                  <button onClick={handleReply} disabled={sending || !reply.trim()}
                    className="p-3 rounded-xl text-white disabled:opacity-40 transition hover:opacity-90 flex-shrink-0"
                    style={{ background: M }}>
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-3 bg-gray-50 border-t text-center">
                <p className="text-xs text-gray-400">{t("support.ticketClosed", { status: active.status?.replace(/_/g, " ") })}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════ CREATE MODAL ════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{t("support.create.title")}</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("support.create.subject")} <span className="text-red-500">*</span></label>
                <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8B1E3F]/15 focus:border-[#8B1E3F]/30"
                  placeholder={t("support.create.subjectPlaceholder")} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("support.create.description")} <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:ring-2 focus:ring-[#8B1E3F]/15 focus:border-[#8B1E3F]/30"
                  placeholder={t("support.create.descriptionPlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("support.create.category")}</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("support.create.priority")}</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                    <option value="low">{t("support.priority.low")}</option>
                    <option value="medium">{t("support.priority.medium")}</option>
                    <option value="high">{t("support.priority.high")}</option>
                    <option value="urgent">{t("support.priority.urgent")}</option>
                  </select>
                </div>
              </div>
              {createErr && <p className="text-xs text-red-600">{createErr}</p>}
              <button type="submit" disabled={creating}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                style={{ background: M }}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {creating ? t("support.create.creating") : t("support.create.submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// "use client";

// /**
//  * Full Support Page — Tenant Side
//  * ─────────────────────────────────────────────────────
//  * Split-pane layout:
//  *   LEFT  → ticket list (filtered, searchable)
//  *   RIGHT → chat-style conversation thread
//  *
//  * On mobile: single-column with back navigation.
//  */

// import { useState, useEffect, useCallback, useRef } from "react";
// import { useApp } from "@/contexts/AppContext";
// import {
//   Search, Plus, Send, Loader2, X, ArrowLeft,
//   MessageSquare, Clock, Filter, ChevronDown,
//   Paperclip, Download, File as FileIcon,
// } from "lucide-react";
// import {
//   createTicket, fetchMyTickets,
//   fetchTicketDetail, fetchTicketMessages, replyToTicket, closeMyTicket,
// } from "@/lib/supportApi";

// const M = "#8B1E3F";

// const STATUS = {
//   open:              { label: "Open",          dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
//   in_progress:       { label: "In Progress",   dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
//   waiting_customer:  { label: "Awaiting Reply", dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-700" },
//   resolved:          { label: "Resolved",      dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
//   closed:            { label: "Closed",        dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600" },
// };

// const PRIORITY_PILL = {
//   low: "bg-gray-100 text-gray-600", medium: "bg-blue-50 text-blue-700",
//   high: "bg-amber-50 text-amber-700", urgent: "bg-red-50 text-red-700",
// };

// export default function SupportPage() {
//   const { activeTenant, t } = useApp();

//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [search, setSearch] = useState("");

//   // conversation
//   const [active, setActive] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [msgLoad, setMsgLoad] = useState(false);
//   const [reply, setReply] = useState("");
//   const [sending, setSending] = useState(false);

//   // create modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });
//   const [creating, setCreating] = useState(false);
//   const [createErr, setCreateErr] = useState("");

//   const endRef = useRef(null);

//   // ── load ──
//   const load = useCallback(async () => {
//     if (!activeTenant) return;
//     setLoading(true);
//     try {
//       const p = {};
//       if (statusFilter !== "all") p.status = statusFilter;
//       if (search) p.search = search;
//       const d = await fetchMyTickets(activeTenant, p);
//       setTickets(Array.isArray(d) ? d : d?.results || []);
//     } catch { setTickets([]); }
//     setLoading(false);
//   }, [activeTenant, statusFilter, search]);

//   useEffect(() => { load(); }, [load]);

//   // ── select ticket ──
//   async function select(ticket) {
//     setActive(ticket);
//     setMsgLoad(true);
//     try {
//       const [det, msgs] = await Promise.all([
//         fetchTicketDetail(activeTenant, ticket.id),
//         fetchTicketMessages(activeTenant, ticket.id),
//       ]);
//       setActive(det);
//       setMessages(Array.isArray(msgs) ? msgs : msgs?.results || []);
//     } catch { setMessages([]); }
//     setMsgLoad(false);
//     setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
//   }

//   // ── reply ──
//   async function handleReply() {
//     if (!reply.trim() || !active) return;
//     setSending(true);
//     try {
//       await replyToTicket(activeTenant, active.id, reply);
//       setReply("");
//       const d = await fetchTicketMessages(activeTenant, active.id);
//       setMessages(Array.isArray(d) ? d : d?.results || []);
//       setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
//     } catch { /* silent */ }
//     setSending(false);
//   }

//   // ── create ──
//   async function handleCreate(e) {
//     e.preventDefault();
//     if (!form.subject.trim() || !form.description.trim()) { setCreateErr("Subject and description required."); return; }
//     setCreating(true);
//     setCreateErr("");
//     try {
//       const t = await createTicket(activeTenant, form);
//       setForm({ subject: "", description: "", category: "general", priority: "medium" });
//       setShowCreate(false);
//       load();
//       if (t?.id) select(t);
//     } catch (err) { setCreateErr(err.message); }
//     setCreating(false);
//   }

//   const isClosed = active?.status === "closed" || active?.status === "resolved";
//   const sc = active ? (STATUS[active.status] || STATUS.open) : null;

//   return (
//     <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

//       {/* ════════════════ LEFT: TICKET LIST ════════════════ */}
//       <div className={`${active ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[360px] lg:min-w-[360px] border-r border-gray-100`}>
//         {/* header */}
//         <div className="px-4 pt-4 pb-3 space-y-2.5">
//           <div className="flex items-center justify-between">
//             <h2 className="text-base font-bold text-gray-900">Support</h2>
//             <button onClick={() => setShowCreate(true)}
//               className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
//               style={{ background: M }}>
//               <Plus className="w-3.5 h-3.5" /> New Ticket
//             </button>
//           </div>
//           {/* search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input type="text" value={search} onChange={e => setSearch(e.target.value)}
//               placeholder="Search tickets…"
//               className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm
//                          focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15" />
//           </div>
//           {/* filter pills */}
//           <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
//             {["all", "open", "in_progress", "waiting_customer", "resolved", "closed"].map(s => (
//               <button key={s} onClick={() => setStatusFilter(s)}
//                 className={`px-2.5 py-[5px] rounded-full text-[10px] font-semibold whitespace-nowrap transition ${
//                   statusFilter === s ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
//                 }`}
//                 style={statusFilter === s ? { background: M } : {}}>
//                 {s === "all" ? "All" : (STATUS[s]?.label || s)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* list */}
//         <div className="flex-1 overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
//           ) : tickets.length === 0 ? (
//             <div className="text-center py-20 px-6">
//               <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
//               <p className="text-sm text-gray-400 font-medium">No tickets found</p>
//             </div>
//           ) : (
//             tickets.map(ticket => {
//               const s = STATUS[ticket.status] || STATUS.open;
//               const isActive = active?.id === ticket.id;
//               return (
//                 <button key={ticket.id} onClick={() => select(ticket)}
//                   className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition group ${
//                     isActive ? "bg-rose-50/60 border-l-[3px]" : "hover:bg-gray-50/60"
//                   }`}
//                   style={isActive ? { borderLeftColor: M } : {}}>
//                   <div className="flex items-start gap-2.5">
//                     <span className={`w-[7px] h-[7px] rounded-full mt-[7px] flex-shrink-0 ${s.dot}`} />
//                     <div className="flex-1 min-w-0">
//                       <p className="text-[13px] font-semibold text-gray-900 truncate">{ticket.subject}</p>
//                       <div className="flex items-center gap-1.5 mt-1">
//                         <span className="text-[10px] font-mono text-gray-400">{ticket.ticket_number}</span>
//                         <span className={`px-1.5 py-[1px] rounded text-[9px] font-semibold ${PRIORITY_PILL[ticket.priority]}`}>
//                           {ticket.priority}
//                         </span>
//                       </div>
//                       <p className="text-[10px] text-gray-400 mt-1">
//                         {new Date(ticket.created_at).toLocaleDateString()}
//                         {ticket.message_count > 0 && ` · ${ticket.message_count} msgs`}
//                       </p>
//                     </div>
//                   </div>
//                 </button>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {/* ════════════════ RIGHT: CONVERSATION ════════════════ */}
//       <div className={`${active ? "flex" : "hidden lg:flex"} flex-col flex-1 min-w-0`}>
//         {!active ? (
//           <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
//             <MessageSquare className="w-14 h-14 mb-3" />
//             <p className="text-sm font-medium text-gray-400">Select a ticket to view</p>
//             <p className="text-xs text-gray-300 mt-1">or create a new one</p>
//           </div>
//         ) : (
//           <>
//             {/* ticket header */}
//             <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-3">
//               <div className="flex items-center gap-3 min-w-0">
//                 <button onClick={() => setActive(null)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
//                   <ArrowLeft className="w-5 h-5 text-gray-500" />
//                 </button>
//                 <div className="min-w-0">
//                   <p className="text-sm font-bold text-gray-900 truncate">{active.subject}</p>
//                   <div className="flex items-center gap-2 mt-1 flex-wrap">
//                     <span className="text-[10px] font-mono text-gray-400">{active.ticket_number}</span>
//                     <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-semibold ${sc.pill}`}>
//                       <span className={`w-[5px] h-[5px] rounded-full ${sc.dot}`} />
//                       {sc.label}
//                     </span>
//                     <span className={`px-1.5 py-[1px] rounded text-[9px] font-semibold ${PRIORITY_PILL[active.priority]}`}>
//                       {active.priority}
//                     </span>
//                     {active.category && (
//                       <span className="text-[10px] text-gray-400 capitalize">{active.category?.replace(/_/g, " ")}</span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {!isClosed && (
//                 <button
//                   onClick={async () => { await closeMyTicket(activeTenant, active.id); const d = await fetchTicketDetail(activeTenant, active.id); setActive(d); load(); }}
//                   className="px-3 py-1.5 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition flex-shrink-0"
//                 >
//                   Close Ticket
//                 </button>
//               )}
//             </div>

//             {/* messages */}
//             <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
//               {/* initial description */}
//               {active.description && (
//                 <div className="bg-gray-50 rounded-xl p-4 mb-2">
//                   <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Original Description</p>
//                   <p className="text-sm text-gray-700 whitespace-pre-wrap">{active.description}</p>
//                 </div>
//               )}

//               {msgLoad ? (
//                 <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
//               ) : (
//                 messages.map(msg => {
//                   const mine = msg.sender_type === "customer";
//                   const sys  = msg.sender_type === "system";
//                   return (
//                     <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
//                       <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
//                         sys
//                           ? "bg-gray-50 text-gray-500 text-center w-full text-[11px] rounded-xl italic"
//                           : mine
//                           ? "text-white rounded-br-md"
//                           : "bg-gray-100 text-gray-800 rounded-bl-md"
//                       }`} style={mine && !sys ? { background: M } : {}}>
//                         {!mine && !sys && (
//                           <p className="text-[10px] font-bold mb-0.5" style={{ color: M }}>{msg.sender_name || "Support Team"}</p>
//                         )}
//                         <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

//                         {/* attachments */}
//                         {msg.attachments?.length > 0 && (
//                           <div className="mt-2 space-y-1">
//                             {msg.attachments.map((att, i) => (
//                               <a key={i} href={att.url} target="_blank" rel="noopener"
//                                 className={`flex items-center gap-1.5 text-[11px] underline underline-offset-2 ${
//                                   mine ? "text-white/80" : "text-blue-600"
//                                 }`}>
//                                 <FileIcon className="w-3 h-3" /> {att.filename || `Attachment ${i + 1}`}
//                               </a>
//                             ))}
//                           </div>
//                         )}

//                         <p className={`text-[10px] mt-1.5 ${mine ? "text-white/40" : "text-gray-400"}`}>
//                           {new Date(msg.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//               <div ref={endRef} />
//             </div>

//             {/* reply */}
//             {!isClosed ? (
//               <div className="px-5 py-3.5 border-t border-gray-100">
//                 <div className="flex items-end gap-2.5">
//                   <div className="flex-1 relative">
//                     <textarea
//                       value={reply} onChange={e => setReply(e.target.value)}
//                       placeholder="Type your message…"
//                       rows={2}
//                       className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none
//                                  focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15 pr-10"
//                       onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
//                     />
//                   </div>
//                   <button onClick={handleReply} disabled={sending || !reply.trim()}
//                     className="p-3 rounded-xl text-white disabled:opacity-40 transition hover:opacity-90 flex-shrink-0"
//                     style={{ background: M }}>
//                     {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="px-5 py-3 bg-gray-50 border-t text-center">
//                 <p className="text-xs text-gray-400">This ticket is {active.status?.replace(/_/g, " ")}.</p>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* ════════════════ CREATE MODAL ════════════════ */}
//       {showCreate && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
//           <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
//             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
//               <h2 className="text-base font-bold text-gray-900">New Support Ticket</h2>
//               <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
//             </div>
//             <form onSubmit={handleCreate} className="p-6 space-y-4">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
//                 <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8B1E3F]/15 focus:border-[#8B1E3F]/30"
//                   placeholder="Brief summary of your issue" />
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
//                 <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
//                   rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:ring-2 focus:ring-[#8B1E3F]/15 focus:border-[#8B1E3F]/30"
//                   placeholder="Describe the issue in detail…" />
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
//                   <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
//                     className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
//                     <option value="general">General</option>
//                     <option value="technical">Technical</option>
//                     <option value="billing">Billing</option>
//                     <option value="bug">Bug Report</option>
//                     <option value="feature_request">Feature Request</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
//                   <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
//                     className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
//                     <option value="low">Low</option>
//                     <option value="medium">Medium</option>
//                     <option value="high">High</option>
//                     <option value="urgent">Urgent</option>
//                   </select>
//                 </div>
//               </div>
//               {createErr && <p className="text-xs text-red-600">{createErr}</p>}
//               <button type="submit" disabled={creating}
//                 className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
//                 style={{ background: M }}>
//                 {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
//                 {creating ? "Creating…" : "Submit Ticket"}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

export default function SupportPage(props) {
  return (
    <TenantPermissionGate permission="support.view">
      <SupportPageInner {...props} />
    </TenantPermissionGate>
  );
}
