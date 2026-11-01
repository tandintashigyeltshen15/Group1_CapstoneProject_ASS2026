"use client";

import { useMemo, useState } from "react";
import {
  HandHeart, Coins, Gift, Clock, Heart, List, CircleCheck, CircleX, BarChart3, Megaphone,
  Library, Laptop, GraduationCap, ArrowRight, ArrowUp, Landmark, Plus, Trash2,
} from "lucide-react";
import { useStore, update, nextId, formatDate } from "@/lib/store";
import { Card, Badge, EmptyState, Field, Toggle, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import {
  Avatar, Modal, Tabs, Table, nu, statusTone, btnSm, btnDanger, btnSuccess,
} from "@/components/AdminUI";

const PERIODS = ["This Year", "Last 30 Days", "All Time"];

const TYPE_STYLE = {
  "Financial Support": "bg-blue-50 text-primary",
  "Equipment & Resources": "bg-purple-100 text-accent",
  Scholarship: "bg-green-100 text-success",
  Infrastructure: "bg-sky-100 text-sky-700",
  Other: "bg-gray-100 text-muted",
};

/* The donut groups the five types into the four slices from the design */
const SLICES = [
  { label: "Financial Support", color: "#1C59DE", types: ["Financial Support"] },
  { label: "Equipment & Resources", color: "#6938EF", types: ["Equipment & Resources"] },
  { label: "Scholarships", color: "#12B76A", types: ["Scholarship"] },
  { label: "Others", color: "#F79009", types: ["Infrastructure", "Other"] },
];

const INITIATIVE_ICON = {
  library: { Icon: Library, tile: "bg-amber-100 text-amber-700" },
  laptop: { Icon: Laptop, tile: "bg-slate-100 text-slate-600" },
  graduation: { Icon: GraduationCap, tile: "bg-indigo-100 text-indigo-700" },
};

const donorSubtitle = (c) =>
  c.donorType === "Alumni" ? `Alumni '${String(c.batch).slice(2)}` : c.donorType;

function TypeBadge({ type }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[type] || TYPE_STYLE.Other}`}>
      {type}
    </span>
  );
}

function StatCard({ icon: Icon, tile, label, value, footer }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tile}`}>
        <Icon size={26} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-sidebar">{label}</p>
        <p className="text-2xl font-bold text-sidebar">{value}</p>
        {footer}
      </div>
    </div>
  );
}

function Donut({ slices, total }) {
  const r = 52, c = 2 * Math.PI * r;
  let offset = 0;
  const k = total >= 1000 ? `Nu. ${Math.round(total / 1000)}K` : nu(total);
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Contribution split by type">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#EAECF0" strokeWidth="18" />
      {total > 0 &&
        slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx="70" cy="70" r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
      <text x="70" y="68" textAnchor="middle" fontSize="14" fontWeight="700" fill="#172B4D">{k}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#667085">Total</text>
    </svg>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-medium text-sidebar">{children || "-"}</p>
    </div>
  );
}

export default function AdminContributionsPage() {
  const [contributions] = useStore("adminContributions");
  const [initiatives, setInitiatives] = useStore("adminInitiatives");
  const [stats] = useStore("adminStats");

  const [tab, setTab] = useState("all");
  const [period, setPeriod] = useState("This Year");
  const [openId, setOpenId] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [manage, setManage] = useState(false);
  const [newInit, setNewInit] = useState({ title: "", goal: "" });
  const [flash, setFlash] = useState(null);

  const inPeriod = useMemo(() => {
    const now = new Date();
    return contributions.filter((c) => {
      const d = new Date(c.date);
      if (period === "This Year") return d.getFullYear() === now.getFullYear();
      if (period === "Last 30 Days") return now - d <= 30 * 24 * 3600 * 1000 && d <= now;
      return true;
    });
  }, [contributions, period]);

  const totalValue = 0;
  const donors = 0;
  const pendingAll = contributions.filter((c) => c.status === "Pending");
  const activeInitiatives = initiatives.filter((i) => i.active);

  const counts = {
    all: 0,
    Pending: 0,
    Verified: 0,
    Rejected: 0,
  };
  const shown = (tab === "all" ? inPeriod : inPeriod.filter((c) => c.status === tab))
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const slices = SLICES.map((s) => ({
    ...s,
    value: 0,
  }));

  const current = contributions.find((c) => c.id === openId);

  const close = () => { setOpenId(null); setReason(""); setReasonError(""); };

  const decide = (status) => {
    if (status === "Rejected" && !reason.trim()) {
      setReasonError("Please give a reason so the donor knows what to fix.");
      return;
    }
    update("adminContributions", (list) =>
      list.map((c) => (c.id === current.id ? { ...c, status, reason: status === "Rejected" ? reason.trim() : "" } : c))
    );
    setFlash({ tone: status === "Verified" ? "green" : "red", text: `Contribution from ${current.donor} was ${status.toLowerCase()}.` });
    close();
  };

  const addInitiative = (e) => {
    e.preventDefault();
    const goal = Number(newInit.goal);
    if (!newInit.title.trim() || !(goal > 0)) return;
    setInitiatives((list) => [
      ...list,
      { id: nextId(list), title: newInit.title.trim(), goal, icon: "graduation", active: true },
    ]);
    setNewInit({ title: "", goal: "" });
  };

  const exportCsv = () => {
    const rows = [["Donor", "Type", "Details", "Value (Nu.)", "Date", "Status"], ...shown.map((c) => [c.donor, c.type, c.details, c.value, c.date, c.status])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "contributions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <HandHeart size={32} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-sidebar">Alumni Contributions Management</h1>
          <p className="text-muted">Review, verify, and manage contributions from our alumni to support CST&apos;s growth and student community.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-sidebar">
          <span className="sr-only">Period</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${inputCls} !w-auto`}>
            {PERIODS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      </div>

      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Coins} tile="bg-blue-100 text-primary" label="Total Contributions" value={nu(totalValue)}
          footer={<p className="flex items-center gap-1 text-xs font-medium text-success"><ArrowUp size={12} /> +{stats.growth.contributions}% from last year</p>}
        />
        <StatCard
          icon={Gift} tile="bg-green-100 text-success" label="Total Donors" value={donors}
          footer={<p className="flex items-center gap-1 text-xs font-medium text-success"><ArrowUp size={12} /> +{stats.growth.donors}% from last year</p>}
        />
        <StatCard
          icon={Clock} tile="bg-orange-100 text-warning" label="Pending Verification" value={0}
          footer={<button type="button" onClick={() => setTab("Pending")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Review Now <ArrowRight size={12} /></button>}
        />
        <StatCard
          icon={Heart} tile="bg-purple-100 text-accent" label="Active Initiatives" value={0}
          footer={<button type="button" onClick={() => setManage(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Manage Initiatives <ArrowRight size={12} /></button>}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "all", label: "All Contributions", count: counts.all, icon: List },
              { key: "Pending", label: "Pending", count: counts.Pending, icon: Clock },
              { key: "Verified", label: "Verified", count: counts.Verified, icon: CircleCheck },
              { key: "Rejected", label: "Rejected", count: counts.Rejected, icon: CircleX },
            ]}
          />

          <Card
            title={tab === "all" ? "Recent Contributions" : `${tab} Contributions`}
            icon={List}
            action={<button type="button" onClick={exportCsv} className="text-xs font-medium text-primary hover:underline">Export CSV</button>}
          >
            <Table
              head={["#", "Donor", "Contribution Type", "Details", "Date", "Status", "Action"]}
              empty={shown.length === 0 && <EmptyState message="No contributions in this view." />}
            >
              {shown.map((c, i) => (
                <tr key={c.id}>
                  <td className="px-3 py-3 text-sidebar">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.donor} />
                      <div>
                        <p className="font-medium text-sidebar">{c.donor}</p>
                        <p className="text-xs text-muted">{donorSubtitle(c)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><TypeBadge type={c.type} /></td>
                  <td className="px-3 py-3 text-text">{c.details}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-text">{formatDate(c.date)}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                  <td className="px-3 py-3">
                    <button type="button" className={btnSm} onClick={() => setOpenId(c.id)}>
                      {c.status === "Pending" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card
            title="Initiatives Supported by Alumni Contributions"
            icon={Megaphone}
            action={<button type="button" onClick={() => setManage(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Manage Initiatives <ArrowRight size={14} /></button>}
          >
            {activeInitiatives.length === 0 ? (
              <EmptyState message="No active initiatives. Use Manage Initiatives to add one." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {activeInitiatives.map((i) => {
                  const pct = 0;
                  const { Icon, tile } = INITIATIVE_ICON[i.icon] || INITIATIVE_ICON.graduation;
                  return (
                    <div key={i.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg ${tile}`}>
                          <Icon size={28} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sidebar">{i.title}</p>
                          <p className="text-xs text-muted">Supported by 0 alumni</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 flex-1 rounded bg-gray-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${i.title} progress`}>
                          <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-sidebar">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card title="Contribution Overview" icon={BarChart3}>
            <div className="flex flex-wrap items-center gap-4">
              <Donut slices={slices} total={totalValue} />
              <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
                {slices.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-text">{s.label}</span>
                    <span className="font-medium text-sidebar">0%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Pending Verifications" icon={Clock}>
            {pendingAll.length === 0 ? (
              <EmptyState message="Nothing is waiting for verification." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingAll.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sidebar">{c.donor}</p>
                      <p className="truncate text-xs text-muted">{formatDate(c.date)} • {c.details}</p>
                    </div>
                    <button type="button" className={btnSm} onClick={() => setOpenId(c.id)}>Review</button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-blue-100/60 p-6 text-center">
            <Landmark size={64} className="mx-auto mb-3 text-primary/40" />
            <p className="font-serif italic text-sidebar">
              &ldquo;Together, we build a stronger CST —<br />for today&apos;s students and tomorrow&apos;s leaders.&rdquo;
            </p>
            <p className="mt-2 text-xs text-muted">– CST Alumni Community</p>
          </div>
        </div>
      </div>

      {/* View / review modal */}
      {current && (
        <Modal
          title={current.status === "Pending" ? "Review Contribution" : "Contribution Details"}
          onClose={close}
          footer={
            current.status === "Pending" ? (
              <>
                <button type="button" className={btnOutline} onClick={close}>Cancel</button>
                <button type="button" className={btnDanger} onClick={() => decide("Rejected")}><CircleX size={16} /> Reject</button>
                <button type="button" className={btnSuccess} onClick={() => decide("Verified")}><CircleCheck size={16} /> Verify</button>
              </>
            ) : (
              <button type="button" className={btnPrimary} onClick={close}>Close</button>
            )
          }
        >
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={current.donor} size="h-12 w-12" />
            <div className="flex-1">
              <p className="font-semibold text-sidebar">{current.donor}</p>
              <p className="text-xs text-muted">{donorSubtitle(current)}{current.email && ` • ${current.email}`}</p>
            </div>
            <Badge tone={statusTone[current.status]}>{current.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Detail label="Contribution type"><TypeBadge type={current.type} /></Detail>
            <Detail label="Value">{nu(0)}</Detail>
            <Detail label="Details">{current.details}</Detail>
            <Detail label="Date">{formatDate(current.date)}</Detail>
            <Detail label="Supports">{initiatives.find((i) => i.id === current.initiativeId)?.title}</Detail>
          </div>

          {current.note && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-text">
              <p className="mb-1 text-xs text-muted">Note from donor</p>
              {current.note}
            </div>
          )}

          {current.status === "Rejected" && current.reason && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-danger">
              <p className="mb-1 text-xs">Reason for rejection</p>
              {current.reason}
            </div>
          )}

          {current.status === "Pending" && (
            <div className="mt-4">
              <Field label="Reason (needed only if you reject)">
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                  className={inputCls}
                  placeholder="For example: payment could not be confirmed."
                />
              </Field>
              {reasonError && <p className="mt-1 text-xs text-danger">{reasonError}</p>}
            </div>
          )}
        </Modal>
      )}

      {/* Manage initiatives modal */}
      {manage && (
        <Modal title="Manage Initiatives" onClose={() => setManage(false)} width="max-w-2xl" footer={<button type="button" className={btnPrimary} onClick={() => setManage(false)}>Done</button>}>
          <ul className="divide-y divide-gray-100">
            {initiatives.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                <p className="min-w-0 flex-1 text-sm font-medium text-sidebar">{i.title}</p>
                <label className="flex items-center gap-2 text-xs text-muted">
                  Goal (Nu.)
                  <input
                    type="number" min="1" value={i.goal}
                    onChange={(e) => setInitiatives((list) => list.map((x) => (x.id === i.id ? { ...x, goal: Number(e.target.value) } : x)))}
                    className={`${inputCls} !w-32`}
                  />
                </label>
                <div className="w-40">
                  <Toggle
                    label={i.active ? "Active" : "Hidden"}
                    checked={i.active}
                    onChange={(v) => setInitiatives((list) => list.map((x) => (x.id === i.id ? { ...x, active: v } : x)))}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${i.title}`}
                  className="rounded-lg p-2 text-danger hover:bg-red-50"
                  onClick={() => window.confirm(`Delete "${i.title}"?`) && setInitiatives((list) => list.filter((x) => x.id !== i.id))}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={addInitiative} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-4">
            <div className="min-w-[180px] flex-1">
              <Field label="New initiative">
                <input className={inputCls} value={newInit.title} onChange={(e) => setNewInit({ ...newInit, title: e.target.value })} placeholder="Title" required />
              </Field>
            </div>
            <div className="w-36">
              <Field label="Goal (Nu.)">
                <input className={inputCls} type="number" min="1" value={newInit.goal} onChange={(e) => setNewInit({ ...newInit, goal: e.target.value })} required />
              </Field>
            </div>
            <button type="submit" className={btnPrimary}><Plus size={16} /> Add</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
