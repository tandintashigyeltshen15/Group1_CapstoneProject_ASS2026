// Frontend copy of the CST Alumni Portal relational design.
// Table and column names follow the relational diagram. Replace load()/save() with API calls later.
export const ME = "U-A1"; // logged-in alumni's UserID (AlumniID = UserID)

const SEED = {
  ROLE: [{ RoleID: "R1", RoleName: "Student" }, { RoleID: "R2", RoleName: "Alumni" }, { RoleID: "R3", RoleName: "Staff" }, { RoleID: "R4", RoleName: "Administrator" }],
  USER: [
    { UserID: "U-A1", RoleID: "R2", Username: "alumni1", Name: "You (Alumni)", Email: "alumni1@example.com", AccountStatus: "Active", CreatedAt: "2025-01-10" },
    { UserID: "U-A2", RoleID: "R2", Username: "alumni2", Name: "Other Alumni", Email: "alumni2@example.com", AccountStatus: "Active", CreatedAt: "2025-02-11" },
    { UserID: "U-S1", RoleID: "R1", Username: "tshering", Name: "Tshering Dorji", Email: "tshering.d@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2023-08-01" },
    { UserID: "U-S2", RoleID: "R1", Username: "karma", Name: "Karma Wangmo", Email: "karma.w@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2024-08-01" },
    { UserID: "U-S3", RoleID: "R1", Username: "pema", Name: "Pema Choden", Email: "pema.c@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2023-08-01" },
    { UserID: "U-T1", RoleID: "R3", Username: "sonam", Name: "Dr. Sonam Tenzin", Email: "sonam.tenzin@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2020-01-01" },
    { UserID: "U-T2", RoleID: "R3", Username: "dechen", Name: "Ms. Dechen Pelden", Email: "dechen.pelden@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2020-01-01" },
    { UserID: "U-T3", RoleID: "R3", Username: "ugyen", Name: "Mr. Ugyen Wangchuk", Email: "ugyen.w@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2020-01-01" },
    { UserID: "U-T4", RoleID: "R3", Username: "kinley", Name: "Dr. Kinley Dorji", Email: "kinley.dorji@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2020-01-01" },
    { UserID: "U-T5", RoleID: "R3", Username: "yangchen", Name: "Ms. Yangchen Lhamo", Email: "yangchen.l@cst.edu.bt", AccountStatus: "Active", CreatedAt: "2020-01-01" },
  ],
  DEPARTMENT: [{ DepartmentID: "D1", DepartmentName: "Information Technology" }, { DepartmentID: "D2", DepartmentName: "Electronics & Communication" }, { DepartmentID: "D3", DepartmentName: "Civil Engineering" }],
  PROGRAMME: [{ ProgrammeID: "P1", ProgrammeName: "BE Information Technology", DepartmentID: "D1" }, { ProgrammeID: "P2", ProgrammeName: "BE Electronics & Communication", DepartmentID: "D2" }, { ProgrammeID: "P3", ProgrammeName: "BE Civil Engineering", DepartmentID: "D3" }],
  STUDENT_PROFILE: [
    { UserID: "U-S1", StudentID: "02230101", ProgrammeID: "P1", YearOfJoining: 2023, PhoneNo: "17000001", Dzongkhag: "Thimphu", Gewog: "Chang" },
    { UserID: "U-S2", StudentID: "02240102", ProgrammeID: "P1", YearOfJoining: 2024, PhoneNo: "17000002", Dzongkhag: "Paro", Gewog: "Doteng" },
    { UserID: "U-S3", StudentID: "02230103", ProgrammeID: "P2", YearOfJoining: 2023, PhoneNo: "17000003", Dzongkhag: "Wangdue", Gewog: "Athang" },
  ],
  STUDENT_PORTFOLIO: [
    { PortfolioID: "PF1", UserID: "U-S1", Projects: [
        { title: "Campus Event Tracker", description: "Web app for clubs to publish events and track RSVPs.", tech: ["Next.js", "Node.js", "MongoDB"], link: "https://github.com/example/event-tracker" },
        { title: "Library Book Finder", description: "Search and reservation system for the college library.", tech: ["React", "Firebase"], link: "" }],
      TechnicalSkills: ["JavaScript", "React", "Node.js", "SQL", "Git"], SoftSkills: ["Teamwork", "Communication", "Time management"] },
    { PortfolioID: "PF2", UserID: "U-S2", Projects: [
        { title: "Crop Disease Classifier", description: "CNN model that classifies leaf diseases from photos.", tech: ["Python", "TensorFlow"], link: "https://github.com/example/crop-classifier" }],
      TechnicalSkills: ["Python", "Pandas", "TensorFlow", "SQL"], SoftSkills: ["Problem solving", "Presentation", "Leadership"] },
    { PortfolioID: "PF3", UserID: "U-S3", Projects: [
        { title: "Smart Irrigation Controller", description: "Arduino-based soil moisture sensing and automatic watering.", tech: ["Arduino", "C++", "IoT"], link: "" },
        { title: "Home Energy Monitor", description: "Logs household power use to a simple dashboard.", tech: ["ESP32", "MQTT"], link: "" }],
      TechnicalSkills: ["C/C++", "Arduino", "PCB basics", "MQTT"], SoftSkills: ["Adaptability", "Teamwork", "Documentation"] },
  ],
  STAFF_PROFILE: [
    { UserID: "U-T1", StaffID: "ST001", PhoneNo: "17100001", DepartmentID: "D1", Qualifications: "PhD Computer Science", Designation: "Associate Professor", AreaOfExpertise: ["Machine Learning", "Natural Language Processing", "Dzongkha computing"] },
    { UserID: "U-T2", StaffID: "ST002", PhoneNo: "17100002", DepartmentID: "D1", Qualifications: "MSc Software Engineering", Designation: "Lecturer", AreaOfExpertise: ["Web development", "Software engineering", "E-governance"] },
    { UserID: "U-T3", StaffID: "ST003", PhoneNo: "17100003", DepartmentID: "D2", Qualifications: "MEng Electronics", Designation: "Senior Lecturer", AreaOfExpertise: ["IoT", "Embedded systems", "Renewable energy monitoring"] },
    { UserID: "U-T4", StaffID: "ST004", PhoneNo: "17100004", DepartmentID: "D3", Qualifications: "PhD Civil Engineering", Designation: "Professor", AreaOfExpertise: ["Structural engineering", "Landslide risk", "Sustainable construction"] },
    { UserID: "U-T5", StaffID: "ST005", PhoneNo: "17100005", DepartmentID: "D1", Qualifications: "MSc Information Security", Designation: "Lecturer", AreaOfExpertise: ["Cybersecurity", "Networks", "Data privacy"] },
  ],
  MENTORSHIP_REQUEST: [
    { RequestID: "MR1", StudentID: "U-S1", AlumniID: "U-A1", RequestSubject: "Guidance on becoming a full-stack developer", RequestDetail: "I would like advice on building a strong portfolio and preparing for interviews.", Duration: "3 months", RequestDate: "2026-10-02", Status: "Pending" },
    { RequestID: "MR2", StudentID: "U-S2", AlumniID: "U-A1", RequestSubject: "Career path in machine learning", RequestDetail: "I want to learn how to move from academic projects to industry ML work.", Duration: "6 months", RequestDate: "2026-09-28", Status: "Accepted" },
    { RequestID: "MR3", StudentID: "U-S3", AlumniID: "U-A2", RequestSubject: "Embedded systems career", RequestDetail: "Request sent to a different alumnus (hidden from you).", Duration: "2 months", RequestDate: "2026-10-01", Status: "Pending" },
  ],
  OPPORTUNITY: [
    { OpportunityID: "O1", CreatorID: "U-A1", Title: "Embedded Systems Intern", OpportunityType: "Internship", Description: "Work on IoT prototypes.", Deadline: "2026-11-15", StartDate: "2026-12-01", Duration: "2 months", EligibilityRequirements: "Year 3 or 4, ECE or IT", Status: "Open" },
    { OpportunityID: "O2", CreatorID: "U-A1", Title: "Junior Web Developer", OpportunityType: "Job", Description: "Build internal web tools.", Deadline: "2026-11-30", StartDate: "2027-01-10", Duration: "Permanent", EligibilityRequirements: "Final-year IT students", Status: "Open" },
  ],
  APPLICATION: [
    { ApplicationID: "AP1", StudentID: "U-S3", OpportunityID: "O1", SubmissionDate: "2026-10-05", ApplicationStatus: "Pending" },
    { ApplicationID: "AP2", StudentID: "U-S1", OpportunityID: "O2", SubmissionDate: "2026-10-07", ApplicationStatus: "Pending" },
  ],
  // NEW table (not in the diagram yet): alumni -> staff collaboration proposals
  COLLABORATION_REQUEST: [],
  NOTIFICATION: [],
};

const KEY = "cst_db_v1";
export const load = () => {
  if (typeof window === "undefined") return SEED;
  try { const r = window.localStorage.getItem(KEY); if (r) return { ...SEED, ...JSON.parse(r) }; } catch (e) {}
  return SEED;
};
export const save = (db) => { try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} return db; };
export const reset = () => save(JSON.parse(JSON.stringify(SEED)));

// ---- joins ----
export const getStudent = (db, userId) => {
  const user = db.USER.find((u) => u.UserID === userId);
  const profile = db.STUDENT_PROFILE.find((s) => s.UserID === userId);
  const programme = db.PROGRAMME.find((p) => p.ProgrammeID === profile?.ProgrammeID);
  const department = db.DEPARTMENT.find((d) => d.DepartmentID === programme?.DepartmentID);
  const portfolio = db.STUDENT_PORTFOLIO.find((p) => p.UserID === userId);
  return { user, profile, programme, department, portfolio };
};
// Staff = USER (role Staff) + STAFF_PROFILE + DEPARTMENT
export const getStaffList = (db) => {
  const staffRole = db.ROLE.find((r) => r.RoleName === "Staff")?.RoleID;
  return db.STAFF_PROFILE.map((sp) => {
    const user = db.USER.find((u) => u.UserID === sp.UserID);
    const dept = db.DEPARTMENT.find((d) => d.DepartmentID === sp.DepartmentID);
    return { ...sp, Name: user?.Name, Email: user?.Email, RoleID: user?.RoleID, DepartmentName: dept?.DepartmentName };
  }).filter((s) => s.RoleID === staffRole);
};
export const addNotification = (db, userId, type, message) => ({
  ...db,
  NOTIFICATION: [...db.NOTIFICATION, { NotificationID: "N" + Date.now() + Math.floor(Math.random() * 1000), UserID: userId, NotificationType: type, Message: message, CreatedAt: new Date().toISOString().slice(0, 10), IsRead: false }],
});

export const ui = {
  page: { padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "inherit" },
  card: { border: "1px solid #d9dde3", borderRadius: 10, padding: 16, background: "#fff", color: "#1f2937", marginBottom: 12 },
  btn: { padding: "8px 14px", borderRadius: 8, border: "1px solid #c3c9d2", background: "#fff", color: "#1f2937", cursor: "pointer", fontSize: 14 },
  btnPrimary: { padding: "8px 14px", borderRadius: 8, border: "1px solid #1d4ed8", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontSize: 14 },
  btnDanger: { padding: "8px 14px", borderRadius: 8, border: "1px solid #b91c1c", background: "#b91c1c", color: "#fff", cursor: "pointer", fontSize: 14 },
  input: { padding: "8px 10px", borderRadius: 8, border: "1px solid #c3c9d2", fontSize: 14, background: "#fff", color: "#1f2937" },
  chip: { display: "inline-block", padding: "2px 10px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontSize: 12, marginRight: 6, marginBottom: 6 },
  softChip: { display: "inline-block", padding: "2px 10px", borderRadius: 999, background: "#ecfdf5", color: "#065f46", fontSize: 12, marginRight: 6, marginBottom: 6 },
  h: { fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 6px" },
};
export const statusColor = (s) => (s === "Accepted" ? { background: "#dcfce7", color: "#166534" } : s === "Rejected" ? { background: "#fee2e2", color: "#991b1b" } : { background: "#fef3c7", color: "#92400e" });
