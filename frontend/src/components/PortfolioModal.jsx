"use client";

import { useEffect, useState } from "react";
import { X, GraduationCap, FolderGit2, Wrench, Smile, FileText, Download, Loader2, Link2, ExternalLink } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
const BASE = `${API_ROOT}/api/alumni/me/students`;

const authHeaders = () => {
  try {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
};

const splitList = (s = "") => s.split(",").map((x) => x.trim()).filter(Boolean);
const splitLines = (s = "") => s.split("\n").map((x) => x.trim()).filter(Boolean);
const formatSize = (b = 0) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-sidebar">
        <Icon size={18} className="text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* Shows a student's profile + portfolio. `children` is the footer (actions).
   Data comes from the backend, and only for students who contacted this alumnus. */
export default function PortfolioModal({ studentId, studentName, subtitle, onClose, children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${BASE}/${encodeURIComponent(studentId)}/portfolio`, { headers: authHeaders() })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Could not load this portfolio.");
        if (!cancelled) setStudent(json);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const downloadFile = async (f) => {
    setBusyId(f.id);
    try {
      const res = await fetch(`${BASE}/${encodeURIComponent(studentId)}/portfolio/${f.id}/download`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.fileName || "portfolio.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Could not download that file.");
    }
    setBusyId(null);
  };

  const name = student?.name ?? studentName ?? "Student";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const projects = splitLines(student?.projects);
  const technical = splitList(student?.technicalSkills);
  const soft = splitList(student?.softSkills);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-gray-200 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-primary">{initials}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-sidebar">{name}</h2>
            <p className="text-sm text-muted">Student ID: {studentId}</p>
            {student && (
              <p className="flex items-center gap-1 text-sm text-muted">
                <GraduationCap size={14} /> {student.programme} &middot; Joined {student.joinYear}
              </p>
            )}
            {subtitle && <p className="mt-1 text-xs font-medium text-primary">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-sidebar"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Loading portfolio...</p>
          ) : !student ? (
            <EmptyState message={error || "This student's portfolio isn't available."} />
          ) : (
            <>
              {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <Section icon={FolderGit2} title="Projects">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted">No projects listed.</p>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((p, i) => (
                      <li key={`${p}-${i}`} className="rounded-lg border border-gray-200 p-3 text-sm text-text">{p}</li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section icon={FileText} title="Portfolio files">
                {student.files.length === 0 ? (
                  <p className="text-sm text-muted">This student hasn't shared any files.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {student.files.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sidebar">{f.title}</p>
                          <p className="text-xs text-muted">
                            {f.category === "CV" ? "CV / Resume" : f.category} &middot;{" "}
                            {f.kind === "link" ? "Web link" : `PDF · ${formatSize(f.size)}`}
                          </p>
                          {f.description && <p className="mt-1 text-xs text-text">{f.description}</p>}
                        </div>
                        {f.kind === "link" ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${f.title}`}
                            className="flex items-center gap-1 rounded-md p-2 text-sm text-primary hover:bg-blue-50"
                          >
                            <Link2 size={14} /> Open <ExternalLink size={13} />
                          </a>
                        ) : (
                          <button
                            onClick={() => downloadFile(f)}
                            disabled={busyId === f.id}
                            aria-label={`Download ${f.title}`}
                            className="rounded-md p-2 text-primary hover:bg-blue-50 disabled:opacity-60"
                          >
                            {busyId === f.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section icon={Wrench} title="Technical skills">
                <div className="flex flex-wrap gap-2">{technical.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}</div>
              </Section>
              <Section icon={Smile} title="Soft skills">
                <div className="flex flex-wrap gap-2">{soft.map((s) => <Badge key={s} tone="green">{s}</Badge>)}</div>
              </Section>
            </>
          )}
        </div>

        {children && <div className="border-t border-gray-200 bg-gray-50 p-4">{children}</div>}
      </div>
    </div>
  );
}