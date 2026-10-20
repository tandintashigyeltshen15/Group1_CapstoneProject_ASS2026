"use client";
// One component for both MENTORSHIP_REQUEST and APPLICATION (to opportunities): in both cases the alumni
// reviews the student's STUDENT_PORTFOLIO before deciding.
import { useEffect, useState } from "react";
import { ME, load, save, reset, getStudent, addNotification, ui, statusColor } from "@/lib/db";

const Badge = ({ status }) => <span style={{ ...statusColor(status), padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{status}</span>;

function Portfolio({ s }) {
  const p = s.portfolio;
  return (
    <div>
      <div style={ui.h}>Student</div>
      <div><strong>{s.user?.Name}</strong> · {s.profile?.StudentID}</div>
      <div style={{ fontSize: 14, color: "#6b7280" }}>{s.programme?.ProgrammeName} · {s.department?.DepartmentName} · joined {s.profile?.YearOfJoining}</div>
      <div style={{ fontSize: 14, color: "#6b7280" }}>{s.user?.Email} · {s.profile?.PhoneNo}</div>
      {!p ? <div style={{ ...ui.card, marginTop: 12 }}>This student has not created a portfolio.</div> : (<>
        <div style={ui.h}>Projects</div>
        {p.Projects.map((pr, i) => (
          <div key={i} style={{ ...ui.card, padding: 12, marginBottom: 8 }}>
            <strong>{pr.title}</strong>
            <div style={{ fontSize: 14, margin: "4px 0" }}>{pr.description}</div>
            <div>{pr.tech.map((t) => <span key={t} style={ui.chip}>{t}</span>)}</div>
            {pr.link && <a href={pr.link} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>View project</a>}
          </div>
        ))}
        <div style={ui.h}>Technical skills</div>
        <div>{p.TechnicalSkills.map((x) => <span key={x} style={ui.chip}>{x}</span>)}</div>
        <div style={ui.h}>Soft skills</div>
        <div>{p.SoftSkills.map((x) => <span key={x} style={ui.softChip}>{x}</span>)}</div>
      </>)}
    </div>
  );
}

export default function ReviewPage({ kind }) {
  const isMentor = kind === "mentorship";
  const [db, setDb] = useState(null);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => { setDb(load()); }, []);
  if (!db) return <div style={ui.page}>Loading…</div>;

  const rows = isMentor
    ? db.MENTORSHIP_REQUEST.filter((r) => r.AlumniID === ME).map((r) => ({
        id: r.RequestID, studentId: r.StudentID, title: r.RequestSubject, detail: r.RequestDetail, date: r.RequestDate, status: r.Status,
        extra: [["Duration", r.Duration]], badge: "Mentorship request" }))
    : db.APPLICATION.map((a) => ({ a, o: db.OPPORTUNITY.find((o) => o.OpportunityID === a.OpportunityID) }))
        .filter(({ o }) => o?.CreatorID === ME)
        .map(({ a, o }) => ({ id: a.ApplicationID, studentId: a.StudentID, title: o.Title, detail: `Applied for: ${o.Title} (${o.OpportunityType}). Eligibility: ${o.EligibilityRequirements}`, date: a.SubmissionDate, status: a.ApplicationStatus,
          extra: [["Type", o.OpportunityType], ["Duration", o.Duration], ["Deadline", o.Deadline]], badge: "Opportunity application" }));

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const open = rows.find((r) => r.id === openId);

  const decide = (row, status) => {
    const table = isMentor ? "MENTORSHIP_REQUEST" : "APPLICATION";
    const idKey = isMentor ? "RequestID" : "ApplicationID";
    const statusKey = isMentor ? "Status" : "ApplicationStatus";
    let next = { ...db, [table]: db[table].map((x) => (x[idKey] === row.id ? { ...x, [statusKey]: status } : x)) };
    next = addNotification(next, row.studentId, isMentor ? "Mentorship" : "Application", `Your ${isMentor ? "mentorship request" : "application"} "${row.title}" was ${status.toLowerCase()}.${note ? " Note: " + note : ""}`);
    save(next); setDb(next); setOpenId(null); setNote("");
  };

  return (
    <div style={ui.page}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{isMentor ? "Mentorship Requests" : "Applications"}</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        {isMentor ? "Requests students sent to you." : "Students who applied to opportunities you posted."} Review the student's portfolio before you decide.
      </p>
      <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
        <select style={ui.input} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option><option>Pending</option><option>Accepted</option><option>Rejected</option>
        </select>
        <button style={ui.btn} onClick={() => setDb(reset())}>Reset sample data</button>
      </div>
      {shown.length === 0 && <div style={ui.card}>Nothing to show.</div>}
      {shown.map((r) => {
        const s = getStudent(db, r.studentId);
        return (
          <div key={r.id} style={ui.card}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={ui.chip}>{r.badge}</span>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{r.title}</div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>From {s.user?.Name} · {r.date}{r.extra.map(([k, v]) => ` · ${k}: ${v}`).join("")}</div>
              </div>
              <Badge status={r.status} />
            </div>
            <p style={{ fontSize: 14 }}>{r.detail}</p>
            <div style={{ fontSize: 13, color: s.portfolio ? "#166534" : "#991b1b" }}>{s.portfolio ? "✔ Student portfolio available" : "✖ No portfolio"}</div>
            <div style={{ marginTop: 10 }}><button style={ui.btnPrimary} onClick={() => setOpenId(r.id)}>View portfolio & respond</button></div>
          </div>
        );
      })}
      {open && (
        <div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: 20, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#1f2937", borderRadius: 12, padding: 24, maxWidth: 720, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{open.title}</h2>
              <button style={ui.btn} onClick={() => setOpenId(null)}>Close</button>
            </div>
            <div style={{ margin: "8px 0" }}><Badge status={open.status} /> <span style={{ fontSize: 14, color: "#6b7280" }}>{open.date}{open.extra.map(([k, v]) => ` · ${k}: ${v}`).join("")}</span></div>
            <p style={{ fontSize: 14 }}>{open.detail}</p>
            <Portfolio s={getStudent(db, open.studentId)} />
            <div style={ui.h}>Your response</div>
            <textarea style={{ ...ui.input, width: "100%", minHeight: 70, boxSizing: "border-box" }} placeholder="Optional note to the student" value={note} onChange={(e) => setNote(e.target.value)} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={ui.btnPrimary} onClick={() => decide(open, "Accepted")}>Accept</button>
              <button style={ui.btnDanger} onClick={() => decide(open, "Rejected")}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
