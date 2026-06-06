// src/app/superadmin/support/page.js
"use client";

/**
 * Platform Admin Support Inbox
 * ─────────────────────────────────────────────────────
 * REPLACES the existing ComingSoon page.
 *
 * Layout:  Stats bar → split-pane (list | conversation)
 * Features:
 *   • Filter by status, priority, search
 *   • Assign ticket to platform staff
 *   • Reply (public) or add internal notes (amber)
 *   • Change status/priority/escalation inline
 */

import { useState, useEffect, useCallback, useRef } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import {
  Search, Loader2, Send, ArrowLeft, RefreshCw,
  MessageSquare, Shield, User, Zap, Eye, EyeOff,
  LifeBuoy, AlertCircle, Clock,
} from "lucide-react";
import {
  fetchAllTickets, fetchTicketStats, fetchTicketById,
  fetchTicketThread, adminReplyToTicket, changeTicketStatus,
  assignTicketTo, changeTicketPriority, escalateTicketById,
  fetchEmployees,
} from "@/lib/platformApi";

const M = "#8B1E3F";

const ST = {
  open:              { label: "Open",          dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  in_progress:       { label: "In Progress",   dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
  waiting_customer:  { label: "Waiting",        dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-700" },
  resolved:          { label: "Resolved",       dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  closed:            { label: "Closed",         dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600" },
};

const PR = {
  low:    { label: "Low",    color: "text-gray-600",  bg: "bg-gray-100" },
  medium: { label: "Medium", color: "text-blue-600",  bg: "bg-blue-50" },
  high:   { label: "High",   color: "text-amber-600", bg: "bg-amber-50" },
  urgent: { label: "Urgent", color: "text-red-600",   bg: "bg-red-50" },
};

export default function AdminSupportPage() {
  const { hasPermission } = useSuperAdmin();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // filters
  const [statusF, setStatusF] = useState("open");
  const [priorityF, setPriorityF] = useState("");
  const [search, setSearch] = useState("");

  // active ticket
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msgLoad, setMsgLoad] = useState(false);
  const [showInternal, setShowInternal] = useState(true);

  // reply
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  // assign
  const [staff, setStaff] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const endRef = useRef(null);

  function flash(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }

  // ── load ──
  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const params = { page_size: 100 };
      if (statusF) params.status = statusF;
      if (priorityF) params.priority = priorityF;
      if (search) params.search = search;
      const [td, sd] = await Promise.all([fetchAllTickets(params), fetchTicketStats()]);
      setTickets(Array.isArray(td) ? td : td?.results || []);
      setStats(sd);
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  }, [statusF, priorityF, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchEmployees?.().then(d => setStaff(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  // ── select ──
  async function select(ticket) {
    setActive(ticket);
    setMsgLoad(true);
    try {
      const [det, thread] = await Promise.all([fetchTicketById(ticket.id), fetchTicketThread(ticket.id, true)]);
      setActive(det);
      setMsgs(Array.isArray(thread) ? thread : thread?.results || []);
    } catch { setMsgs([]); }
    setMsgLoad(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  // ── reply ──
  async function handleReply() {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await adminReplyToTicket(active.id, reply, isInternal);
      setReply("");
      const thread = await fetchTicketThread(active.id, true);
      setMsgs(Array.isArray(thread) ? thread : thread?.results || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      if (!isInternal) flash("Reply sent");
    } catch (e) { flash(e.message, "error"); }
    setSending(false);
  }

  // ── actions ──
  async function doStatus(s) {
    setActionBusy(true);
    try { const u = await changeTicketStatus(active.id, s); setActive(u); load(true); flash(`→ ${s.replace(/_/g, " ")}`); } catch (e) { flash(e.message, "error"); }
    setActionBusy(false);
  }
  async function doPriority(p) {
    setActionBusy(true);
    try { const u = await changeTicketPriority(active.id, p); setActive(u); load(true); } catch (e) { flash(e.message, "error"); }
    setActionBusy(false);
  }
  async function doAssign(agentId) {
    setAssigning(true);
    try { const u = await assignTicketTo(active.id, agentId); setActive(u); setShowAssign(false); load(true); flash("Assigned"); } catch (e) { flash(e.message, "error"); }
    setAssigning(false);
  }
  async function doEscalate() {
    if (!confirm("Escalate to urgent?")) return;
    setActionBusy(true);
    try { const u = await escalateTicketById(active.id, "Escalated by admin"); setActive(u); load(true); flash("Escalated"); } catch (e) { flash(e.message, "error"); }
    setActionBusy(false);
  }

  const visibleMsgs = showInternal ? msgs : msgs.filter(m => !m.is_internal);

  return (
    <SuperAdminLayout title="Support Tickets" description="Manage customer support requests" breadcrumbs={[{ label: "Support" }]}>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_.15s_ease-out]">
          <div className={`px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>{toast.msg}</div>
        </div>
      )}

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5">
          {[
            { label: "Open",         val: stats.open,             c: "text-blue-600" },
            { label: "In Progress",  val: stats.in_progress,      c: "text-amber-600" },
            { label: "Waiting",      val: stats.waiting_customer,  c: "text-violet-600" },
            { label: "Unassigned",   val: stats.unassigned,        c: "text-red-600" },
            { label: "Resolved Today", val: stats.resolved_today,  c: "text-emerald-600" },
            { label: "SLA Breached", val: stats.sla_breached,      c: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 py-3 px-2 text-center">
              <div className={`text-xl font-bold ${s.c}`}>{s.val ?? 0}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main split ── */}
      <div className="flex h-[calc(100vh-310px)] min-h-[480px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* ════ LEFT ════ */}
        <div className={`${active ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[340px] lg:min-w-[340px] border-r border-gray-100`}>
          {/* Filters */}
          <div className="px-3 pt-3 pb-2 space-y-2 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {["open", "in_progress", "waiting_customer", "resolved", "closed", ""].map(s => (
                <button key={s || "all"} onClick={() => setStatusF(s)}
                  className={`px-2 py-[4px] rounded-full text-[10px] font-semibold transition ${
                    statusF === s ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`} style={statusF === s ? { background: M } : {}}>
                  {s ? ST[s]?.label : "All"}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20">
                <LifeBuoy className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No tickets</p>
              </div>
            ) : (
              tickets.map(t => {
                const s = ST[t.status] || ST.open;
                const p = PR[t.priority] || PR.medium;
                const sel = active?.id === t.id;
                return (
                  <button key={t.id} onClick={() => select(t)}
                    className={`w-full text-left px-3 py-3 border-b border-gray-50 transition group ${
                      sel ? "bg-rose-50/60 border-l-[3px]" : "hover:bg-gray-50/50"
                    }`} style={sel ? { borderLeftColor: M } : {}}>
                    <div className="flex items-start gap-2">
                      <span className={`w-[7px] h-[7px] rounded-full mt-[7px] flex-shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{t.subject}</p>
                          {t.is_escalated && <Zap className="w-3 h-3 text-red-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono text-gray-400">{t.ticket_number}</span>
                          <span className={`px-1 py-[1px] rounded text-[9px] font-semibold ${p.bg} ${p.color}`}>{t.priority}</span>
                          <span className="text-[9px] text-gray-400 truncate">{t.tenant_name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                          {t.assigned_to_email
                            ? <span className="text-[9px] text-gray-400">→ {t.assigned_to_email.split("@")[0]}</span>
                            : <span className="text-[9px] text-red-400 font-medium">Unassigned</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="px-3 py-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{tickets.length} tickets</span>
            <button onClick={() => load(true)} disabled={refreshing} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ════ RIGHT ════ */}
        <div className={`${active ? "flex" : "hidden lg:flex"} flex-col flex-1 min-w-0`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <MessageSquare className="w-14 h-14 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Select a ticket</p>
            </div>
          ) : (
            <>
              {/* ── Header + actions ── */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button onClick={() => setActive(null)} className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100">
                      <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{active.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-gray-400">
                        <span className="font-mono">{active.ticket_number}</span>
                        <span>{active.tenant_name}</span>
                        <span>{active.created_by_email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Status */}
                    <select value={active.status} onChange={e => doStatus(e.target.value)} disabled={actionBusy}
                      className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] bg-white focus:outline-none cursor-pointer">
                      {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {/* Priority */}
                    <select value={active.priority} onChange={e => doPriority(e.target.value)} disabled={actionBusy}
                      className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] bg-white focus:outline-none cursor-pointer">
                      {Object.entries(PR).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {/* Assign */}
                    <div className="relative">
                      <button onClick={() => setShowAssign(!showAssign)}
                        className="px-2 py-1 rounded-lg border border-gray-200 text-[11px] hover:bg-gray-50 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="max-w-[60px] truncate">
                          {active.assigned_to_email ? active.assigned_to_email.split("@")[0] : "Assign"}
                        </span>
                      </button>
                      {showAssign && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowAssign(false)} />
                          <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 max-h-52 overflow-y-auto">
                            {staff.filter(s => s.is_active).map(s => (
                              <button key={s.id} onClick={() => doAssign(s.user_id || s.id)} disabled={assigning}
                                className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left truncate">
                                {s.user_name || s.user_email || s.email}
                              </button>
                            ))}
                            {staff.filter(s => s.is_active).length === 0 && (
                              <p className="px-3 py-2 text-xs text-gray-400">No staff available</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Escalate */}
                    {!active.is_escalated && (
                      <button onClick={doEscalate} disabled={actionBusy}
                        className="px-2 py-1 rounded-lg border border-red-200 text-[11px] text-red-600 hover:bg-red-50 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Escalate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Internal toggle bar ── */}
              <div className="px-4 py-1.5 bg-gray-50/60 border-b border-gray-50 flex items-center justify-between">
                <button onClick={() => setShowInternal(!showInternal)} className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-700">
                  {showInternal ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {showInternal ? "Internal notes visible" : "Internal notes hidden"}
                </button>
                <span className="text-[10px] text-gray-400">{msgs.length} messages</span>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* original description */}
                {active.description && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-1 border border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Original Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{active.description}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{active.created_by_email} · {new Date(active.created_at).toLocaleString()}</p>
                  </div>
                )}

                {msgLoad ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : (
                  visibleMsgs.map(msg => {
                    const cust = msg.sender_type === "customer";
                    const sys  = msg.sender_type === "system";
                    const internal = msg.is_internal;
                    return (
                      <div key={msg.id} className={`flex ${cust ? "justify-start" : sys ? "justify-center" : "justify-end"}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                          internal
                            ? "bg-amber-50 border border-amber-200/60 rounded-xl"
                            : cust
                            ? "bg-gray-100 text-gray-800 rounded-bl-md"
                            : sys
                            ? "bg-gray-50 text-gray-500 text-center w-full text-[11px] rounded-lg italic"
                            : "text-white rounded-br-md"
                        }`} style={!cust && !sys && !internal ? { background: M } : {}}>
                          {internal && (
                            <div className="flex items-center gap-1 mb-1">
                              <Shield className="w-3 h-3 text-amber-600" />
                              <span className="text-[10px] font-bold text-amber-700">Internal Note</span>
                            </div>
                          )}
                          {cust && <p className="text-[10px] font-bold text-gray-500 mb-0.5">{msg.sender_name}</p>}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${
                            internal ? "text-amber-500" : cust ? "text-gray-400" : sys ? "text-gray-400" : "text-white/40"
                          }`}>
                            {msg.sender_name} · {new Date(msg.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* ── Reply bar ── */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setIsInternal(false)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      !isInternal ? "text-white" : "bg-gray-100 text-gray-500"
                    }`} style={!isInternal ? { background: M } : {}}>
                    Reply
                  </button>
                  <button onClick={() => setIsInternal(true)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                      isInternal ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-500"
                    }`}>
                    <Shield className="w-3 h-3" /> Internal Note
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply} onChange={e => setReply(e.target.value)}
                    placeholder={isInternal ? "Add internal note (not visible to tenant)…" : "Type your reply…"}
                    rows={2}
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 ${
                      isInternal ? "border-amber-200 bg-amber-50/30 focus:ring-amber-200" : "border-gray-200 focus:ring-[#8B1E3F]/15"
                    }`}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  />
                  <button onClick={handleReply} disabled={sending || !reply.trim()}
                    className={`p-3 rounded-xl text-white disabled:opacity-40 transition hover:opacity-90 flex-shrink-0 ${isInternal ? "bg-amber-600" : ""}`}
                    style={!isInternal ? { background: M } : {}}>
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}