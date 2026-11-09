"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Landmark,
  Copy,
  Check,
  X,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  CalendarDays,
  Gift,
} from "lucide-react";

/* ---------- API helpers ---------- */
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
const API_BASE = `${API_ROOT}/api`;
const BASE = `${API_BASE}/contributions/member`;

function authHeaders() {
  const h = {};
  try {
    const t = localStorage.getItem("token");
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {}
  return h;
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Something went wrong. Please try again.");
  return json.data;
}

async function fetchBlob(path) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the file.");
  return res.blob();
}

/* ---------- formatting ---------- */
const nu = (n) => `Nu. ${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysLeft = (d) => Math.ceil((new Date(`${d}T23:59:59`) - new Date()) / 86400000);

const STATUS = {
  Pending: { icon: Clock, cls: "bg-amber-50 text-amber-700 ring-amber-200", label: "Pending review" },
  Verified: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Verified" },
  Rejected: { icon: XCircle, cls: "bg-red-50 text-red-700 ring-red-200", label: "Rejected" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.Pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {s.label}
    </span>
  );
}

function AuthImage({ path, alt, className, fallback }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let url;
    let cancelled = false;
    fetchBlob(path)
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);
  return src ? <img src={src} alt={alt} className={className} /> : fallback;
}

/* ---------- campaign card ---------- */
function CampaignCard({ c, onContribute }) {
  const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100)) : 0;
  const left = daysLeft(c.deadline);
  const canPay = c.type === "Monetary" && left >= 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-40 w-full bg-slate-100">
        {c.hasImage ? (
          <AuthImage
            path={`/campaigns/${c.id}/image`}
            alt={c.title}
            className="h-40 w-full object-cover"
            fallback={<div className="h-40 w-full animate-pulse bg-slate-100" />}
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600">
            <Gift className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{c.category}</span>
          <span className={`text-xs font-medium ${left <= 7 ? "text-red-600" : "text-slate-500"}`}>
            {left < 0 ? "Ended" : left === 0 ? "Ends today" : `${left} day${left === 1 ? "" : "s"} left`}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900">{c.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-slate-600">{c.description}</p>
        </div>

        {c.type === "Monetary" ? (
          <div className="mt-auto">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-slate-900">{nu(c.raisedAmount)}</span>
              <span className="text-slate-500">of {nu(c.targetAmount)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {c.contributorCount} verified contribution{c.contributorCount === 1 ? "" : "s"}
              {c.myContributions > 0 && ` · You have submitted ${c.myContributions}`}
            </p>
          </div>
        ) : (
          <p className="mt-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            This campaign accepts {c.type.toLowerCase()} contributions. Contact the alumni office to take part.
          </p>
        )}

        <button
          onClick={() => onContribute(c)}
          disabled={!canPay}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {left < 0 ? "Campaign ended" : c.type !== "Monetary" ? "Not available online" : "Contribute"}
        </button>
      </div>
    </div>
  );
}

/* ---------- bank details ---------- */
function BankDetails({ bank }) {
  const [copied, setCopied] = useState(false);
  if (!bank) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        Bank details have not been added yet. Check back soon.
      </div>
    );
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bank.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-900">
        <Landmark className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold">Where to send your payment</h2>
      </div>
      <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Bank</dt>
          <dd className="font-medium text-slate-900">
            {bank.bankName}
            {bank.branch ? `, ${bank.branch}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Account name</dt>
          <dd className="font-medium text-slate-900">{bank.accountName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Account number</dt>
          <dd className="flex items-center gap-2 font-medium text-slate-900">
            {bank.accountNumber}
            <button
              onClick={copy}
              aria-label="Copy account number"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </dd>
        </div>
        {bank.instructions && (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Instructions</dt>
            <dd className="text-slate-800">{bank.instructions}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* ---------- contribute modal ---------- */
function ContributeModal({ campaign, bank, onClose, onDone }) {
  const [form, setForm] = useState({ amount: "", reference: "", paymentDate: todayStr(), isAnonymous: false });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async () => {
    setError("");
    if (!(Number(form.amount) > 0)) return setError("Enter an amount greater than zero.");
    if (!form.reference.trim()) return setError("Enter the transaction or journal number.");
    if (!file) return setError("Upload your payment receipt.");
    if (file.size > 5 * 1024 * 1024) return setError("Receipt must be 5 MB or smaller.");

    const body = new FormData();
    body.append("amount", form.amount);
    body.append("reference", form.reference.trim());
    body.append("paymentDate", form.paymentDate);
    body.append("isAnonymous", String(form.isAnonymous));
    body.append("receipt", file);

    setBusy(true);
    try {
      await api(`/campaigns/${campaign.id}/payments`, { method: "POST", body });
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const input =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Contribute to {campaign.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pay by bank transfer first, then enter the details and upload the receipt.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {bank && (
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-medium">{bank.accountName}</span> · {bank.bankName} · {bank.accountNumber}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Amount (Nu.)
            <input type="number" min="1" step="0.01" value={form.amount} onChange={set("amount")} className={input} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Transaction / journal number
            <input type="text" maxLength={50} value={form.reference} onChange={set("reference")} className={input} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Payment date
            <input type="date" max={todayStr()} value={form.paymentDate} onChange={set("paymentDate")} className={input} />
          </label>

          <div>
            <span className="block text-sm font-medium text-slate-700">Payment receipt</span>
            <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50/40">
              <Upload className="h-5 w-5 text-blue-600" />
              <span className="truncate">{file ? file.name : "Choose a JPG, PNG, WebP or PDF (up to 5 MB)"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={set("isAnonymous")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>Hide my name from the public contributor list</span>
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit payment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- my contributions ---------- */
function MyPayments({ payments }) {
  const [busyId, setBusyId] = useState(null);

  const download = async (p) => {
    setBusyId(p.id);
    try {
      const blob = await fetchBlob(`/my-payments/${p.id}/receipt`);
      const ext = blob.type.includes("pdf") ? "pdf" : blob.type.split("/")[1] || "file";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${p.reference}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {}
    setBusyId(null);
  };

  if (!payments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        You have not made any contributions yet. Pick an open campaign to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Transaction no.</th>
            <th className="px-4 py-3 font-medium">Paid on</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((p) => (
            <tr key={p.id} className="align-top">
              <td className="px-4 py-3 font-medium text-slate-900">{p.campaignTitle}</td>
              <td className="px-4 py-3 text-slate-800">{nu(p.amount)}</td>
              <td className="px-4 py-3 text-slate-600">{p.reference}</td>
              <td className="px-4 py-3 text-slate-600">{fmtDate(p.paymentDate)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
                {p.status === "Rejected" && p.remarks && (
                  <p className="mt-1 max-w-[220px] text-xs text-red-600">{p.remarks}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => download(p)}
                  disabled={busyId === p.id}
                  className="inline-flex items-center gap-1.5 text-blue-700 hover:underline disabled:opacity-60"
                >
                  {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- page ---------- */
export default function StaffContributionsPage() {
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [c, b, p] = await Promise.all([api("/campaigns"), api("/bank-details"), api("/my-payments")]);
      setCampaigns(c);
      setBank(b);
      setPayments(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDone = () => {
    setSelected(null);
    setToast("Payment submitted. An admin will verify it shortly.");
    setTab("mine");
    load();
    setTimeout(() => setToast(""), 4000);
  };

  const tabBtn = (id, label, count) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        tab === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
      {count > 0 && <span className={`ml-2 text-xs ${tab === id ? "text-blue-100" : "text-slate-400"}`}>{count}</span>}
    </button>
  );

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#14264f]">Contributions</h1>
        <p className="mt-1 text-slate-600">Support CST campaigns and track your payments.</p>
      </div>

      {toast && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading contributions...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}{" "}
          <button onClick={load} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <BankDetails bank={bank} />

          <div className="flex gap-2">
            {tabBtn("campaigns", "Open campaigns", campaigns.length)}
            {tabBtn("mine", "My contributions", payments.length)}
          </div>

          {tab === "campaigns" ? (
            campaigns.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {campaigns.map((c) => (
                  <CampaignCard key={c.id} c={c} onContribute={setSelected} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                <CalendarDays className="mx-auto mb-2 h-6 w-6" />
                No campaigns are open right now.
              </div>
            )
          ) : (
            <MyPayments payments={payments} />
          )}
        </div>
      )}

      {selected && (
        <ContributeModal campaign={selected} bank={bank} onClose={() => setSelected(null)} onDone={handleDone} />
      )}
    </div>
  );
}