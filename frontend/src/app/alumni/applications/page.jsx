"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FolderOpen, X } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls, btnOutline } from "@/components/ui";

const STATUSES = ["Under Review", "Shortlisted", "Accepted", "Not Selected"];
const tones = { "Under Review": "orange", Shortlisted: "blue", Accepted: "green", "Not Selected": "red" };

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const splitList = (text = "") =>
  text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

const mapApp = (a, opp) => ({
  id: a.ApplicationID,
  opportunityId: opp.OpportunityID,
  opportunityTitle: opp.Title,
  submissionDate: a.SubmissionDate,
  status: a.ApplicationStatus,
  studentName: a.student.user.Name,
  studentId: a.student.StudentID,
  programme: a.student.programme.ProgrammeName,
  joinYear: a.student.JoinYear,
  technicalSkills: a.student.TechnicalSkills || "",
  softSkills: a.student.SoftSkills || "",
  projects: a.student.Projects || "",
});

function Tags({ list }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((t) => (
        <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-primary">{t}</span>
      ))}
    </div>
  );
}

function PortfolioModal({ app, onClose, children }) {
  const technical = splitList(app.technicalSkills);
  const soft = splitList(app.softSkills);
  const projects = app.projects.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-sidebar">{app.studentName}</h3>
            <p className="text-xs text-muted">Applied for: {app.opportunityTitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-muted" /></button>
        </div>

        <div className="mb-5 space-y-4 text-sm">
          <p className="text-text">{app.programme} · joined {app.joinYear} · {app.studentId}</p>
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
        </div>

        {children}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      // the API lists applicants per posting, so fetch each posting that has any
      const opps = await api("/alumni/me/opportunities");
      const withApps = opps.filter((o) => o._count.application > 0);
      const lists = await Promise.all(
        withApps.map((o) =>
          api(`/alumni/me/opportunities/${o.OpportunityID}/applications`).then((rows) =>
            rows.map((a) => mapApp(a, o))
          )
        )
      );
      setApplications(lists.flat());
    } catch (err) {
      setError(err.message);
    }
    try {
      setRegistrations(await api("/events/registrations/mine"));
    } catch (err) {
      setError(err.message);
    }
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const selected = applications.find((a) => a.id === selectedId) ?? null;
  const sorted = [...applications].sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

  async function changeStatus(app, status) {
    if (status === app.status) return;
    setError("");
    setMessage("");
    setBusyId(app.id);
    try {
      await api(`/alumni/me/applications/${app.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ApplicationStatus: status }),
      });
      setMessage(`${app.studentName}: ${status}. The student was notified.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function cancelRegistration(reg) {
    setError("");
    setMessage("");
    setBusyId(`reg-${reg.RegistrationID}`);
    try {
      await api(`/events/${reg.event.EventID}/register`, { method: "DELETE" });
      setMessage(`Registration cancelled for ${reg.event.Title}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Applications" subtitle="Review internship applicants and their portfolios, and your event registrations." />
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      <Card title="Internship applicants" className="mb-6">
        {sorted.length === 0 ? (
          <EmptyState message={loaded ? "No applications received yet." : "Loading..."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Internship</th>
                  <th className="pb-2 font-medium">Submitted</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Portfolio</th>
                  <th className="pb-2 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3">
                      <p className="font-medium text-sidebar">{a.studentName}</p>
                      <p className="text-xs text-muted">{a.studentId}</p>
                    </td>
                    <td className="py-3 text-text">{a.opportunityTitle}</td>
                    <td className="py-3 text-muted">{fmtDate(a.submissionDate)}</td>
                    <td className="py-3"><Badge tone={tones[a.status] || "gray"}>{a.status}</Badge></td>
                    <td className="py-3">
                      <button onClick={() => setSelectedId(a.id)} className={btnOutline + " !px-3 !py-1.5"}>
                        <FolderOpen size={14} /> View
                      </button>
                    </td>
                    <td className="py-3">
                      <select
                        className={inputCls + " !w-auto"}
                        value={a.status}
                        disabled={busyId === a.id}
                        onChange={(e) => changeStatus(a, e.target.value)}
                        aria-label={`Update status for ${a.studentName}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="My event registrations">
        {registrations.length === 0 ? (
          <EmptyState message={loaded ? "You haven't registered for any events. Go to Events to register." : "Loading..."} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {registrations.map((r) => {
              const upcoming = new Date(r.event.DateTime) >= new Date();
              return (
                <li key={r.RegistrationID} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-sidebar">{r.event.Title}</p>
                    <p className="text-xs text-muted">
                      {fmtDateTime(r.event.DateTime)}{r.event.Venue && ` · ${r.event.Venue}`}
                    </p>
                    <p className="text-xs text-muted">Registered on {fmtDate(r.RegistrationDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={upcoming ? "green" : "gray"}>{upcoming ? "Registered" : "Attended"}</Badge>
                    {upcoming && (
                      <button
                        onClick={() => cancelRegistration(r)}
                        disabled={busyId === `reg-${r.RegistrationID}`}
                        className="text-sm text-danger hover:underline disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {selected && (
        <PortfolioModal app={selected} onClose={() => setSelectedId(null)}>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text">
            <span>Update status:</span>
            <select
              className={inputCls + " !w-auto"}
              value={selected.status}
              disabled={busyId === selected.id}
              onChange={(e) => changeStatus(selected, e.target.value)}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </PortfolioModal>
      )}
    </div>
  );
}