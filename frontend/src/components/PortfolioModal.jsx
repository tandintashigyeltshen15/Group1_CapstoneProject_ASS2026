"use client";

import { useEffect } from "react";
import { X, GraduationCap, FolderGit2, Wrench, Smile, Link2 } from "lucide-react";
import { getStudent } from "@/lib/students";
import { Badge, EmptyState } from "@/components/ui";

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

/* Shows a student's profile + portfolio. `children` is the footer (actions). */
export default function PortfolioModal({ studentId, studentName, subtitle, onClose, children }) {
  const student = getStudent(studentId);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const name = student?.name ?? studentName;
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

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
                <GraduationCap size={14} /> {student.programme} &middot; Joined {student.yearOfJoining}
              </p>
            )}
            {subtitle && <p className="mt-1 text-xs font-medium text-primary">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-sidebar"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!student ? (
            <EmptyState message="This student hasn't added a portfolio yet." />
          ) : (
            <>
              <Section icon={FolderGit2} title="Projects">
                {student.projects.length === 0 ? (
                  <p className="text-sm text-muted">No projects listed.</p>
                ) : (
                  <ul className="space-y-3">
                    {student.projects.map((p) => (
                      <li key={p.title} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-sidebar">{p.title}</p>
                        <p className="text-sm text-text">{p.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {p.tech.map((t) => <Badge key={t} tone="blue">{t}</Badge>)}
                          {p.link && <span className="flex items-center gap-1 text-xs text-primary"><Link2 size={12} /> {p.link}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section icon={Wrench} title="Technical skills">
                <div className="flex flex-wrap gap-2">{student.technicalSkills.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}</div>
              </Section>
              <Section icon={Smile} title="Soft skills">
                <div className="flex flex-wrap gap-2">{student.softSkills.map((s) => <Badge key={s} tone="green">{s}</Badge>)}</div>
              </Section>
            </>
          )}
        </div>

        {children && <div className="border-t border-gray-200 bg-gray-50 p-4">{children}</div>}
      </div>
    </div>
  );
}
