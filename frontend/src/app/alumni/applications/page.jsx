"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { useStore, update, addNotification, formatDate, formatDateTime } from "@/lib/store";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls, btnOutline } from "@/components/ui";
import PortfolioModal from "@/components/PortfolioModal";

const STATUSES = ["Submitted", "UnderReview", "Shortlisted", "Accepted", "Rejected"];
const label = (s) => (s === "UnderReview" ? "Under review" : s);
const tones = { Submitted: "blue", UnderReview: "orange", Shortlisted: "blue", Accepted: "green", Rejected: "red", Withdrawn: "gray" };

export default function ApplicationsPage() {
  const [applications] = useStore("applications");
  const [opps] = useStore("opportunities");
  const [events] = useStore("events");
  const [registrations] = useStore("registrations");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const titleOf = (id) => opps.find((o) => o.id === id)?.title ?? "Removed posting";
  const selected = applications.find((a) => a.id === selectedId) ?? null;

  function changeStatus(app, status) {
    update("applications", (list) => list.map((a) => (a.id === app.id ? { ...a, applicationStatus: status } : a)));
    addNotification("Application", `${app.studentName}'s application is now ${label(status).toLowerCase()}.`);
    setMessage(`${app.studentName}: ${label(status)}.`);
  }

  function cancelRegistration(reg, ev) {
    update("registrations", (list) => list.filter((r) => r.id !== reg.id));
    addNotification("Event", `You cancelled your registration for ${ev.title}.`);
    setMessage(`Registration cancelled for ${ev.title}.`);
  }

  return (
    <div>
      <PageHeader title="Applications" subtitle="Review internship applicants and their portfolios, and your event registrations." />
      {message && <Notice>{message}</Notice>}

      <Card title="Internship applicants" className="mb-6">
        {applications.length === 0 ? (
          <EmptyState message="No applications received yet." />
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
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3">
                      <p className="font-medium text-sidebar">{a.studentName}</p>
                      <p className="text-xs text-muted">{a.studentId}</p>
                    </td>
                    <td className="py-3 text-text">{titleOf(a.opportunityId)}</td>
                    <td className="py-3 text-muted">{formatDate(a.submissionDate)}</td>
                    <td className="py-3"><Badge tone={tones[a.applicationStatus]}>{label(a.applicationStatus)}</Badge></td>
                    <td className="py-3">
                      <button onClick={() => setSelectedId(a.id)} className={btnOutline + " !px-3 !py-1.5"}><FolderOpen size={14} /> View</button>
                    </td>
                    <td className="py-3">
                      <select className={inputCls + " !w-auto"} value={a.applicationStatus} onChange={(e) => changeStatus(a, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
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
          <EmptyState message="You haven't registered for any events. Go to Events to register." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {registrations.map((r) => {
              const ev = events.find((e) => e.id === r.eventId);
              if (!ev) return null;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-sidebar">{ev.title}</p>
                    <p className="text-xs text-muted">{formatDateTime(ev.dateTime)} &middot; {ev.venue}</p>
                    <p className="text-xs text-muted">Registered on {formatDate(r.registrationDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="green">Registered</Badge>
                    <button onClick={() => cancelRegistration(r, ev)} className="text-sm text-danger hover:underline">Cancel</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {selected && (
        <PortfolioModal
          studentId={selected.studentId}
          studentName={selected.studentName}
          subtitle={`Applied for: ${titleOf(selected.opportunityId)}`}
          onClose={() => setSelectedId(null)}
        >
          <div className="flex flex-wrap items-center gap-3 text-sm text-text">
            <span>Update status:</span>
            <select className={inputCls + " !w-auto"} value={selected.applicationStatus} onChange={(e) => changeStatus(selected, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
        </PortfolioModal>
      )}
    </div>
  );
}
