"use client";

/**
 * Provider Custom Requests — V3.F.3 inbox.
 *
 * The provider is the tenant's employee/contractor. The workspace
 * stays focused on doing work: triage the inbox, open a thread,
 * reply, deliver. No quoting, no provider assignment, no customer
 * management — those belong to the tenant.
 *
 * Composed entirely from the design system + shared
 * custom-request primitives. BrandRoot at the page root mounts
 * the active tenant's accent so a provider serving multiple
 * tenants sees the right brand in the right workspace.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox, ListChecks, CheckCircle, Archive, RefreshCw, MessageCircle,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import DashboardLayout from "@/components/provider/DashboardLayout";
import PlanFeatureGate from "@/components/dashboard/PlanFeatureGate";

import {
  StatusBadge,
  ListRowSkeleton,
  STATUS_TONE,
  TERMINAL_STATUSES,
} from "@/components/custom-requests";
import {
  Card,
  Button,
  PageHeader,
  FilterBar,
  EmptyState,
  Avatar,
  BrandRoot,
} from "@/components/ui";

import { fetchProviderRequests } from "./api";

const TABS = {
  inbox: {
    label: "Inbox",
    icon: Inbox,
    statuses: ["pending", "negotiating", "quoted"],
    emptyTitle: "Inbox zero",
    emptyHint: "New assignments will land here.",
  },
  mine: {
    label: "My Requests",
    icon: ListChecks,
    statuses: ["accepted", "converted"],
    emptyTitle: "Nothing in progress",
    emptyHint: "Requests you've won and are delivering show up here.",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    statuses: ["completed"],
    emptyTitle: "No completed requests yet",
    emptyHint: "Wrapped-up work moves here.",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    statuses: ["rejected", "cancelled"],
    emptyTitle: "Nothing archived",
    emptyHint: "Rejected and cancelled requests are kept here.",
  },
};

const TAB_TONE = {
  inbox: "yellow",
  mine: "emerald",
  completed: "slate",
  archived: "gray",
};

function relTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d`;
  return new Date(iso).toLocaleDateString();
}

export default function ProviderCustomRequestsClient() {
  return (
    <DashboardLayout pageName="Custom Requests">
      <BrandRoot className="contents">
        {/* Plan-gated: blocks direct URL access when the tenant's plan doesn't
            include custom requests. Inside DashboardLayout so PlanProvider is
            available. */}
        <PlanFeatureGate feature="custom_requests">
          <Inner />
        </PlanFeatureGate>
      </BrandRoot>
    </DashboardLayout>
  );
}

function Inner() {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [tab, setTab] = useState("inbox");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchProviderRequests(tenantId);
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = {};
    for (const key of Object.keys(TABS)) {
      c[key] = requests.filter((r) => TABS[key].statuses.includes(r.status)).length;
    }
    return c;
  }, [requests]);

  const visible = useMemo(() => {
    const statuses = TABS[tab].statuses;
    return requests
      .filter((r) => statuses.includes(r.status))
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
  }, [requests, tab]);

  const tabOptions = useMemo(() => Object.entries(TABS).map(([key, def]) => ({
    value: key,
    label: def.label,
    count: counts[key] || 0,
    tone: TAB_TONE[key],
  })), [counts]);

  const current = TABS[tab];
  const CurrentIcon = current.icon;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="Custom Requests"
        subtitle={`${requests.length} assigned · ${counts.inbox} active`}
        actions={(
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        )}
      />

      <FilterBar value={tab} onChange={setTab} options={tabOptions} ariaLabel="Inbox tabs" />

      {loading ? (
        <ListRowSkeleton count={4} />
      ) : error ? (
        <Card padding="lg">
          <EmptyState
            icon={RefreshCw}
            title="Couldn't load your inbox"
            hint={error}
            action={<Button onClick={load}>Try again</Button>}
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={CurrentIcon}
            title={current.emptyTitle}
            hint={current.emptyHint}
          />
        </Card>
      ) : (
        <ul className="space-y-2" aria-label={`${current.label} requests`}>
          {visible.map((r) => (
            <li key={r.id}>
              <Card
                interactive
                padding="md"
                as="button"
                onClick={() => router.push(`/provider/custom-requests/${r.id}`)}
                className="!block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/40"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={r.customer_name || r.customer_email}
                    role="customer"
                    size="md"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {relTime(r.updated_at || r.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      #{r.request_number} · {r.customer_name || r.customer_email || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={r.status} size="sm" />
                      {r.budget_max && (
                        <span className="text-[11px] text-gray-500">
                          up to {r.budget_max}
                        </span>
                      )}
                      {r.deadline && (
                        <span className="text-[11px] text-gray-500">
                          due {r.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
