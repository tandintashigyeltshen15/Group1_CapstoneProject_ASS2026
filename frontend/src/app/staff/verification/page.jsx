"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { API_ORIGIN } from "@/components/Avatar";
import { Mail, GraduationCap, Check, X, FileText } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const TABS = ["Pending", "Approved", "Rejected"];
const tones = { Pending: "orange", Approved: "green", Rejected: "red" };
// The page says Approved; the database calls it Active
const API_STATUS = { Pending: "Pending", Approved: "Active", Rejected: "Rejected" };

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AlumniVerificationPage() {
  const [lists, setLists] = useState({ Pending: [], Approved: [], Rejected: [] });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("Pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [proofBusyId, setProofBusyId] = useState(null);

  const load = () =>
    Promise.all(TABS.map((t) => api(`/verification/alumni?status=${API_STATUS[t]}`)))
      .then(([pending, approved, rejected]) => {
        setLists({ Pending: pending, Approved: approved, Rejected: rejected });
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const counts = Object.fromEntries(TABS.map((t) => [t, lists[t].length]));

  // Oldest first in the pending queue, newest first elsewhere
  const shown = [...lists[tab]].sort((a, b) =>
    tab === "Pending"
      ? new Date(a.appliedAt) - new Date(b.appliedAt)
      : new Date(b.appliedAt) - new Date(a.appliedAt)
  );

  function changeTab(t) {
    setTab(t);
    setRejectingId(null);
    setReason("");
    setError("");
  }

  async function viewProof(r) {
    setError("");
    setProofBusyId(r.id);
    // Open the tab first, inside the click, so the browser doesn't block it
    const win = window.open("", "_blank");
    try {
      const res = await fetch(`${API_ORIGIN}/api/verification/alumni/${r.id}/proof`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not open the document");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (win) win.close();
      setError(err.message);
    } finally {
      setProofBusyId(null);
    }
  }

  async function approve(r) {
    setError("");
    setMessage("");
    setBusyId(r.id);
    try {
      await api(`/verification/alumni/${r.id}/approve`, { method: "POST" });
      setRejectingId(null);
      setMessage(`${r.name} was approved and can now log in. They will appear in the alumni directory.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function startReject(id) {
    setRejectingId(id);
    setReason("");
    setError("");
  }

  async function confirmReject(r) {
    if (reason.trim().length < 5) {
      return setError("Give a reason (at least 5 characters) so the applicant can correct it and resubmit.");
    }
    setError("");
    setMessage("");
    setBusyId(r.id);
    try {
      await api(`/verification/alumni/${r.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRejectingId(null);
      setReason("");
      setMessage(`${r.name}'s application was rejected.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Alumni Verification"
        subtitle="Check each applicant's graduation details and proof against the alumni registry, then approve or reject."
      />
      {message && <Notice>{message}</Notice>}
      {error && rejectingId === null && <Notice tone="red">{error}</Notice>}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-white" : "border border-gray-300 bg-white text-sidebar hover:bg-gray-50"
            }`}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState message={loaded ? `No ${tab.toLowerCase()} applications.` : "Loading..."} />
        </Card>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => {
            const label = tab; // Pending / Approved / Rejected
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sidebar">{r.name}</h3>
                    <p className="text-xs text-muted">Applied {fmtDate(r.appliedAt)}</p>
                  </div>
                  <Badge tone={tones[label]}>{label}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-text sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-muted" /> {r.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-muted" /> {r.programme}, class of{" "}
                    {r.graduationYear}
                  </p>
                </div>

                <div className="mt-3">
                  {r.hasProof ? (
                    <button
                      onClick={() => viewProof(r)}
                      disabled={proofBusyId === r.id}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline disabled:opacity-60"
                    >
                      <FileText size={15} />
                      {proofBusyId === r.id ? "Opening..." : "View proof of graduation"}
                    </button>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-warning">
                      <FileText size={15} /> No proof of graduation was uploaded
                    </p>
                  )}
                </div>

                {label === "Rejected" && r.rejectionReason && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-danger">
                    <b>Reason shown to applicant:</b> {r.rejectionReason}
                  </p>
                )}

                {label === "Pending" && rejectingId !== r.id && (
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => approve(r)} disabled={busyId === r.id} className={btnPrimary}>
                      <Check size={16} /> {busyId === r.id ? "Working..." : "Approve"}
                    </button>
                    <button onClick={() => startReject(r.id)} disabled={busyId === r.id} className={btnOutline}>
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}

                {rejectingId === r.id && (
                  <div className="mt-4">
                    {error && <Notice tone="red">{error}</Notice>}
                    <label htmlFor={`reason-${r.id}`} className="mb-1 block text-sm font-medium text-sidebar">
                      Reason for rejection
                    </label>
                    <textarea
                      id={`reason-${r.id}`}
                      rows={2}
                      maxLength={250}
                      className={inputCls}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell the applicant what to fix before resubmitting"
                    />
                    <p className="mt-1 text-xs text-muted">{reason.length}/250</p>
                    <div className="mt-3 flex gap-3">
                      <button onClick={() => confirmReject(r)} disabled={busyId === r.id} className={btnPrimary}>
                        {busyId === r.id ? "Working..." : "Confirm rejection"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setError("");
                        }}
                        className={btnOutline}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}