"use client";

import { useState } from "react";
import { FileText, Mail, GraduationCap, Briefcase, Check, X } from "lucide-react";
import { useStore, update, nextId, formatDate } from "@/lib/store";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const TABS = ["Pending", "Approved", "Rejected"];
const tones = { Pending: "orange", Approved: "green", Rejected: "red" };

export default function AlumniVerificationPage() {
  const [requests] = useStore("verificationRequests");
  const [tab, setTab] = useState("Pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const counts = TABS.reduce((acc, t) => {
    acc[t] = requests.filter((r) => r.status === t).length;
    return acc;
  }, {});
  const shown = requests
    .filter((r) => r.status === tab)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  function changeTab(t) {
    setTab(t);
    setRejectingId(null);
    setReason("");
    setError("");
  }

  function approve(r) {
    update("verificationRequests", (list) =>
      list.map((x) => (x.id === r.id ? { ...x, status: "Approved", reason: "" } : x))
    );
    // A verified alumnus becomes part of the alumni directory
    update("alumniDirectory", (list) =>
      list.some((a) => a.email === r.email)
        ? list
        : [
            {
              id: nextId(list), name: r.name, email: r.email, programme: r.programme,
              graduationYear: r.graduationYear, jobTitle: r.designation, company: "",
              location: "", expertise: "", isMentor: false, bio: "",
            },
            ...list,
          ]
    );
    setRejectingId(null);
    setMessage(`${r.name} was approved and added to the alumni directory.`);
  }

  function startReject(id) {
    setRejectingId(id);
    setReason("");
    setError("");
  }

  function confirmReject(r) {
    if (!reason.trim()) return setError("Give a reason so the applicant can correct it and resubmit.");
    update("verificationRequests", (list) =>
      list.map((x) => (x.id === r.id ? { ...x, status: "Rejected", reason: reason.trim() } : x))
    );
    setRejectingId(null);
    setReason("");
    setError("");
    setMessage(`${r.name}'s application was rejected.`);
  }

  return (
    <div>
      <PageHeader
        title="Alumni Verification"
        subtitle="Check each applicant's graduation details and document against the alumni registry, then approve or reject."
      />
      {message && <Notice>{message}</Notice>}

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
        <Card><EmptyState message={`No ${tab.toLowerCase()} applications.`} /></Card>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{r.name}</h3>
                  <p className="text-xs text-muted">Applied {formatDate(r.submittedAt)}</p>
                </div>
                <Badge tone={tones[r.status]}>{r.status}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-text sm:grid-cols-2">
                <p className="flex items-center gap-2"><Mail size={14} className="text-muted" /> {r.email}</p>
                <p className="flex items-center gap-2"><GraduationCap size={14} className="text-muted" /> {r.programme}, class of {r.graduationYear}</p>
                <p className="flex items-center gap-2"><Briefcase size={14} className="text-muted" /> {r.designation || "—"}</p>
                <p className="flex items-center gap-2"><FileText size={14} className="text-muted" /> {r.document}</p>
              </div>

              {r.status === "Rejected" && r.reason && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-danger"><b>Reason shown to applicant:</b> {r.reason}</p>
              )}

              {r.status === "Pending" && rejectingId !== r.id && (
                <div className="mt-4 flex gap-3">
                  <button onClick={() => approve(r)} className={btnPrimary}><Check size={16} /> Approve</button>
                  <button onClick={() => startReject(r.id)} className={btnOutline}><X size={16} /> Reject</button>
                </div>
              )}

              {rejectingId === r.id && (
                <div className="mt-4">
                  {error && <Notice tone="red">{error}</Notice>}
                  <label htmlFor={`reason-${r.id}`} className="mb-1 block text-sm font-medium text-sidebar">Reason for rejection</label>
                  <textarea
                    id={`reason-${r.id}`}
                    rows={2}
                    className={inputCls}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell the applicant what to fix before resubmitting"
                  />
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => confirmReject(r)} className={btnPrimary}>Confirm rejection</button>
                    <button onClick={() => setRejectingId(null)} className={btnOutline}>Cancel</button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}