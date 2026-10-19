"use client";

import { useState } from "react";
import { Check, X, Clock, FolderOpen } from "lucide-react";
import { useStore, update, addNotification, formatDate } from "@/lib/store";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls, btnOutline } from "@/components/ui";
import PortfolioModal from "@/components/PortfolioModal";

const tones = { Pending: "orange", Accepted: "green", Declined: "red", Cancelled: "gray" };
const FILTERS = ["All", "Pending", "Accepted", "Declined"];

export default function MentorshipPage() {
  const [requests] = useStore("mentorship");
  const [profile] = useStore("profile");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");

  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? requests.length : requests.filter((r) => r.status === f).length;
    return acc;
  }, {});
  const shown = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  function respond(req, status, responseNote = "") {
    update("mentorship", (list) =>
      list.map((r) => (r.id === req.id ? { ...r, status, responseNote: responseNote.trim() } : r))
    );
    addNotification("Mentorship", `You ${status.toLowerCase()} the mentorship request from ${req.studentName}.`);
    setMessage(`Request from ${req.studentName} ${status.toLowerCase()}.`);
    setSelectedId(null);
    setNote("");
  }

  const openPortfolio = (r) => { setSelectedId(r.id); setNote(r.responseNote ?? ""); };

  return (
    <div>
      <PageHeader title="Mentorship Requests" subtitle="Review a student's portfolio, then accept or decline." />

      {!profile.isAvailableForMentorship && (
        <Notice tone="red">You are currently marked as unavailable for mentorship. Turn this on in Settings to receive new requests.</Notice>
      )}
      {message && <Notice>{message}</Notice>}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "border border-gray-300 bg-white text-sidebar hover:bg-gray-50"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState message="No requests in this category." /></Card>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{r.subject}</h3>
                  <p className="text-sm text-muted">{r.studentName} ({r.studentId}) &middot; requested {formatDate(r.requestDate)}</p>
                </div>
                <Badge tone={tones[r.status]}>{r.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-text">{r.detail}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted"><Clock size={12} /> Duration: {r.duration}</p>
              {r.responseNote && (
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-text"><b className="text-sidebar">Your note:</b> {r.responseNote}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openPortfolio(r)} className={btnOutline}><FolderOpen size={16} /> View portfolio</button>
                {r.status === "Pending" && (
                  <>
                    <button onClick={() => respond(r, "Accepted")} className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => respond(r, "Declined")} className="inline-flex items-center gap-2 rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-red-50">
                      <X size={16} /> Decline
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <PortfolioModal
          studentId={selected.studentId}
          studentName={selected.studentName}
          subtitle={`Request: ${selected.subject}`}
          onClose={() => setSelectedId(null)}
        >
          {selected.status === "Pending" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-sidebar">Note to the student (optional)</label>
              <textarea rows={2} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Happy to help. Let's meet next week." />
              <div className="mt-3 flex gap-3">
                <button onClick={() => respond(selected, "Accepted", note)} className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Check size={16} /> Accept</button>
                <button onClick={() => respond(selected, "Declined", note)} className="inline-flex items-center gap-2 rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-red-50"><X size={16} /> Decline</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-text">Status: <Badge tone={tones[selected.status]}>{selected.status}</Badge></div>
          )}
        </PortfolioModal>
      )}
    </div>
  );
}
