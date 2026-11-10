"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Check, X, Clock, FolderOpen, Mail } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, Notice, Toggle, inputCls, btnOutline } from "@/components/ui";

const tones = { Pending: "orange", Accepted: "green", Declined: "red" };
const FILTERS = ["All", "Pending", "Accepted", "Declined"];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const splitList = (text = "") =>
  text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

const acceptBtn =
  "inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60";
const declineBtn =
  "inline-flex items-center gap-2 rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-red-50 disabled:opacity-60";

function Tags({ list }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((t) => (
        <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-primary">{t}</span>
      ))}
    </div>
  );
}

function PortfolioModal({ request, onClose, children }) {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/mentor-inbox/requests/${request.id}/student`)
      .then(setStudent)
      .catch((err) => setError(err.message));
  }, [request.id]);

  const technical = splitList(student?.technicalSkills);
  const soft = splitList(student?.softSkills);
  const projects = (student?.projects || "").split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-sidebar">{request.studentName}</h3>
            <p className="text-xs text-muted">Request: {request.subject}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-muted" /></button>
        </div>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        {!student && !error && <p className="py-6 text-center text-sm text-muted">Loading...</p>}

        {student && (
          <div className="mb-5 space-y-4 text-sm">
            <p className="text-text">
              {student.programme} · joined {student.joinYear} · {student.studentId}
            </p>

            <div>
              <p className="mb-1.5 font-medium text-sidebar">Technical skills</p>
              {technical.length ? <Tags list={technical} /> : <p className="italic text-muted">Not added yet</p>}
            </div>
            <div>
              <p className="mb-1.5 font-medium text-sidebar">Soft skills</p>
              {soft.length ? <Tags list={soft} /> : <p className="italic text-muted">Not added yet</p>}
            </div>
            <div>
              <p className="mb-1.5 font-medium text-sidebar">Projects</p>
              {projects.length ? (
                <ul className="list-disc space-y-1 pl-5 text-text">
                  {projects.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              ) : (
                <p className="italic text-muted">Not added yet</p>
              )}
            </div>
            {student.email && (
              <p className="flex items-center gap-2 text-primary">
                <Mail size={14} /> {student.email}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default function MentorshipPage() {
  const [data, setData] = useState({ available: false, isPublic: true, requests: [] });
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/mentor-inbox")
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const requests = data.requests;
  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? requests.length : requests.filter((r) => r.status === f).length;
    return acc;
  }, {});
  const shown = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  async function toggleAvailability(value) {
    setError("");
    setMessage("");
    setData((d) => ({ ...d, available: value }));
    try {
      await api("/mentor-inbox/availability", { method: "PUT", body: JSON.stringify({ available: value }) });
      setMessage(
        value
          ? "You're now listed as a mentor. Students can find you and send requests."
          : "You're no longer listed as a mentor. Existing requests stay here."
      );
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function respond(req, status, responseNote = "") {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api(`/mentor-inbox/requests/${req.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: responseNote.trim() }),
      });
      setMessage(`Request from ${req.studentName} ${status.toLowerCase()}. The student was notified.`);
      setSelectedId(null);
      setNote("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const openPortfolio = (r) => {
    setSelectedId(r.id);
    setNote("");
  };

  return (
    <div>
      <PageHeader title="Mentorship Requests" subtitle="Review a student's portfolio, then accept or decline." />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sidebar">Available for mentorship</p>
            <p className="text-sm text-muted">
              Students can only find you under Find a Mentor while this is on.
            </p>
          </div>
          <Toggle checked={data.available} onChange={toggleAvailability} label="Available for mentorship" />
        </div>
        {data.available && !data.isPublic && (
          <p className="mt-3 text-xs text-warning">
            Your profile is set to private, so students can&apos;t see you in the mentor list. Make it public in your profile to appear.
          </p>
        )}
      </Card>

      {!data.available && loaded && (
        <Notice tone="red">
          You are currently marked as unavailable for mentorship. Turn it on above to receive new requests.
        </Notice>
      )}
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

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
        <Card>
          <EmptyState message={loaded ? "No requests in this category." : "Loading..."} />
        </Card>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{r.subject}</h3>
                  <p className="text-sm text-muted">
                    {r.studentName} ({r.studentId}) &middot; {r.programme} &middot; requested {fmtDate(r.requestDate)}
                  </p>
                </div>
                <Badge tone={tones[r.status]}>{r.status}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-text">{r.detail}</p>
              {r.duration && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                  <Clock size={12} /> Duration: {r.duration}
                </p>
              )}
              {r.contactEmail && (
                <p className="mt-2 flex items-center gap-1 text-sm text-primary">
                  <Mail size={14} />
                  <a href={`mailto:${r.contactEmail}`} className="hover:underline">{r.contactEmail}</a>
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openPortfolio(r)} className={btnOutline}>
                  <FolderOpen size={16} /> View portfolio
                </button>
                {r.status === "Pending" && (
                  <>
                    <button onClick={() => respond(r, "Accepted")} disabled={busy} className={acceptBtn}>
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => respond(r, "Declined")} disabled={busy} className={declineBtn}>
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
        <PortfolioModal key={selected.id} request={selected} onClose={() => setSelectedId(null)}>
          {selected.status === "Pending" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-sidebar">
                Note to the student (optional)
              </label>
              <textarea
                rows={2}
                maxLength={120}
                className={inputCls}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Happy to help. Let's meet next week."
              />
              <p className="mt-1 text-xs text-muted">{note.length}/120 · sent to the student in a notification</p>
              <div className="mt-3 flex gap-3">
                <button onClick={() => respond(selected, "Accepted", note)} disabled={busy} className={acceptBtn}>
                  <Check size={16} /> Accept
                </button>
                <button onClick={() => respond(selected, "Declined", note)} disabled={busy} className={declineBtn}>
                  <X size={16} /> Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-text">
              Status: <Badge tone={tones[selected.status]}>{selected.status}</Badge>
            </div>
          )}
        </PortfolioModal>
      )}
    </div>
  );
}