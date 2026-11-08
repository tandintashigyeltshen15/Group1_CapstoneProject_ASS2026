"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Users,
  Send,
  Handshake,
  Search,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Mail,
  X,
} from "lucide-react";

const tabs = ["Overview", "Find a Mentor", "My Requests", "My Mentors"];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const statusConfig = {
  PENDING: { label: "Pending", style: "bg-orange-100 text-warning", icon: Clock },
  ACCEPTED: { label: "Accepted", style: "bg-green-100 text-success", icon: CheckCircle2 },
  DECLINED: { label: "Declined", style: "bg-red-100 text-danger", icon: XCircle },
};

const inputStyle =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

/* ----------------------------- pieces ----------------------------- */
function Avatar({ name, size = "h-14 w-14" }) {
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-primary`}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }) {
  const { label, style, icon: Icon } = statusConfig[status] || statusConfig.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${style}`}
    >
      <Icon size={14} /> {label}
    </span>
  );
}

function Panel({ title, subtitle, onViewAll, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-sidebar">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View All <ArrowRight size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="py-8 text-center text-sm text-muted">{message}</p>;
}

function StatCard({ icon: Icon, label, value, linkLabel, onClick, iconStyle }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconStyle}`}
      >
        <Icon size={26} />
      </div>
      <div>
        <p className="text-sm font-medium text-sidebar">{label}</p>
        <p className="text-2xl font-bold text-sidebar">{value}</p>
        <button
          onClick={onClick}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function MentorCard({ mentor, onRequest }) {
  const isPending = mentor.myRequestStatus === "Pending";
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={mentor.name} />
        <div>
          <p className="font-semibold text-sidebar">{mentor.name}</p>
          <p className="text-sm text-muted">
            {mentor.jobTitle}
            {mentor.company ? ` at ${mentor.company}` : ""}
          </p>
          {mentor.programme && (
            <p className="text-xs text-muted">
              {mentor.programme} {mentor.graduationYear && `| ${mentor.graduationYear}`}
            </p>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {mentor.expertise?.map((t) => (
          <span key={t} className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-primary">
            {t}
          </span>
        ))}
      </div>
      <button
        onClick={() => onRequest(mentor)}
        disabled={isPending}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UserPlus size={16} />
        {isPending ? "Request Pending" : "Request Mentorship"}
      </button>
    </div>
  );
}

function RequestsTable({ requests, onDetails }) {
  if (requests.length === 0) return <EmptyState message="No mentorship requests yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-muted">
            <th className="py-3 font-medium">Mentor</th>
            <th className="py-3 font-medium">Request Date</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 last:border-0">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.mentor.name} size="h-10 w-10" />
                  <div>
                    <p className="font-medium text-sidebar">{r.mentor.name}</p>
                    <p className="text-xs text-muted">
                      {r.mentor.jobTitle}
                      {r.mentor.company ? `, ${r.mentor.company}` : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-text">{formatDate(r.date)}</td>
              <td className="py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-3 text-right">
                <button
                  onClick={() => onDetails(r)}
                  className="rounded-lg border border-primary px-4 py-1.5 text-sm font-medium text-primary hover:bg-blue-50"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sidebar">{title}</h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function MentorshipPage() {
  const [tab, setTab] = useState("Overview");
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState({ areaOfInterest: "", message: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    api("/mentorship")
      .then((d) => {
        setMentors(d.mentors);
        setRequests(
          d.requests.map((r) => {
            const m = d.mentors.find((x) => x.id === r.alumniId);
            return {
              id: r.id,
              date: r.date,
              status: r.status.toUpperCase(), // "Pending" -> "PENDING"
              areaOfInterest: r.subject,
              message: r.detail,
              mentor: {
                name: r.mentorName,
                jobTitle: m?.jobTitle || "",
                company: m?.company || "",
                email: r.contactEmail, // only filled once the mentor accepts
              },
            };
          })
        );
      })
      .catch((err) => console.warn(err.message));

  useEffect(() => {
    load();
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");
  const accepted = requests.filter((r) => r.status === "ACCEPTED");

  const filteredMentors = mentors.filter((m) =>
    `${m.name} ${m.company ?? ""} ${m.jobTitle ?? ""} ${(m.expertise ?? []).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const closeRequestModal = () => {
    setSelectedMentor(null);
    setError("");
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api("/mentorship/requests", {
        method: "POST",
        body: JSON.stringify({
          alumniId: selectedMentor.id,
          subject: form.areaOfInterest,
          detail: form.message,
        }),
      });
      setSelectedMentor(null);
      setForm({ areaOfInterest: "", message: "" });
      await load();
      setTab("My Requests");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Users size={36} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Mentorship</h1>
          <p className="text-muted">
            Connect with alumni mentors, seek guidance, and grow in your academic and career journey.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-8 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-text hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={Users}
              label="Mentors Available"
              value={mentors.length}
              linkLabel="Browse Mentors"
              onClick={() => setTab("Find a Mentor")}
              iconStyle="bg-blue-100 text-primary"
            />
            <StatCard
              icon={Send}
              label="Pending Requests"
              value={pending.length}
              linkLabel="View Requests"
              onClick={() => setTab("My Requests")}
              iconStyle="bg-green-100 text-success"
            />
            <StatCard
              icon={Handshake}
              label="My Mentors"
              value={accepted.length}
              linkLabel="View Mentors"
              onClick={() => setTab("My Mentors")}
              iconStyle="bg-purple-100 text-accent"
            />
          </div>

          <Panel
            title="Available Mentors"
            subtitle="Alumni who have opted in to mentor students."
            onViewAll={() => setTab("Find a Mentor")}
          >
            {mentors.length === 0 ? (
              <EmptyState message="No mentors available yet." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mentors.slice(0, 3).map((m) => (
                  <MentorCard key={m.id} mentor={m} onRequest={setSelectedMentor} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="My Mentorship Requests" onViewAll={() => setTab("My Requests")}>
            <RequestsTable requests={requests.slice(0, 3)} onDetails={setSelectedRequest} />
          </Panel>
        </div>
      )}

      {/* Find a Mentor */}
      {tab === "Find a Mentor" && (
        <div>
          <div className="relative mb-4 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skills, company..."
              className={`${inputStyle} pl-9`}
            />
          </div>
          {filteredMentors.length === 0 ? (
            <Panel title="Available Mentors">
              <EmptyState
                message={
                  mentors.length === 0 ? "No mentors available yet." : "No mentors match your search."
                }
              />
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredMentors.map((m) => (
                <MentorCard key={m.id} mentor={m} onRequest={setSelectedMentor} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Requests */}
      {tab === "My Requests" && (
        <Panel title="My Mentorship Requests">
          <RequestsTable requests={requests} onDetails={setSelectedRequest} />
        </Panel>
      )}

      {/* My Mentors (accepted requests) */}
      {tab === "My Mentors" && (
        <Panel title="My Mentors" subtitle="Mentors who accepted your request.">
          {accepted.length === 0 ? (
            <EmptyState message="No accepted mentorships yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {accepted.map((r) => (
                <li key={r.id} className="flex items-center gap-4 py-4">
                  <Avatar name={r.mentor.name} />
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{r.mentor.name}</p>
                    <p className="text-xs text-muted">
                      {r.mentor.jobTitle}
                      {r.mentor.company ? `, ${r.mentor.company}` : ""}
                    </p>
                    <p className="text-xs text-muted">Topic: {r.areaOfInterest}</p>
                  </div>
                  {r.mentor.email && (
                    <a
                      href={`mailto:${r.mentor.email}`}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Mail size={14} /> {r.mentor.email}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {/* Request modal */}
      {selectedMentor && (
        <Modal
          title={`Request mentorship from ${selectedMentor.name}`}
          onClose={closeRequestModal}
        >
          <form onSubmit={sendRequest}>
            <label className="mb-1 block text-sm text-text">Area of interest</label>
            <input
              value={form.areaOfInterest}
              onChange={(e) => setForm({ ...form, areaOfInterest: e.target.value })}
              placeholder="e.g. Web development, career planning"
              className={`${inputStyle} mb-4`}
              maxLength={50}
              required
            />
            <label className="mb-1 block text-sm text-text">Short description</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="What would you like guidance on?"
              className={`${inputStyle} mb-4`}
              required
            />
            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Request"}
            </button>
          </form>
        </Modal>
      )}

      {/* Request details modal */}
      {selectedRequest && (
        <Modal title="Request details" onClose={() => setSelectedRequest(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={selectedRequest.mentor.name} size="h-12 w-12" />
              <div>
                <p className="font-medium text-sidebar">{selectedRequest.mentor.name}</p>
                <p className="text-xs text-muted">
                  {selectedRequest.mentor.jobTitle}
                  {selectedRequest.mentor.company ? `, ${selectedRequest.mentor.company}` : ""}
                </p>
              </div>
            </div>
            <StatusBadge status={selectedRequest.status} />
            <p>
              <span className="text-muted">Area of interest: </span>
              {selectedRequest.areaOfInterest}
            </p>
            <p>
              <span className="text-muted">Your message: </span>
              {selectedRequest.message}
            </p>
            <p className="text-muted">Sent on {formatDate(selectedRequest.date)}</p>
            {selectedRequest.status === "ACCEPTED" && selectedRequest.mentor.email && (
              <p className="flex items-center gap-1 text-primary">
                <Mail size={14} /> {selectedRequest.mentor.email}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}