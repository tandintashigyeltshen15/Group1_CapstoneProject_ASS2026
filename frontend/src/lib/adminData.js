/* ------------------------------------------------------------------
   Seed data for the ADMIN pages. It is merged into SEEDS in store.js,
   so useStore("adminContributions") etc. work exactly like the other
   pages. Every key maps to a MySQL table, so later you can swap these
   for API calls without touching the pages.

     adminContributions -> Contribution (+ verification status)
     adminInitiatives   -> Initiative the contributions support
     adminUsers         -> User + Role
     adminOpportunities -> Opportunity (Job / Internship)
     adminEvents        -> Event (with approval status)
------------------------------------------------------------------- */

export const ADMIN_SEEDS = {
  // Numbers that come from the whole database (not just the demo rows below)
  adminStats: {
    totalAlumni: 2458,
    activeMentors: 186,
    reportedContent: 3,
    growth: {
      alumni: 12.5,
      mentors: 8.3,
      contributions: 12,
      donors: 8,
      internships: 14.3,
      events: 7.1,
    },
  },

  // Last 7 days of activity for the dashboard line chart
  adminAnalytics: {
    labels: ["Oct 19", "Oct 20", "Oct 21", "Oct 22", "Oct 23", "Oct 24", "Oct 25"],
    series: [
      { key: "alumni", label: "Alumni Registrations", color: "#1C59DE", values: [38, 46, 58, 52, 66, 44, 60] },
      { key: "contributions", label: "Contributions", color: "#12B76A", values: [18, 26, 31, 24, 35, 22, 33] },
      { key: "mentorship", label: "Mentorship Requests", color: "#6938EF", values: [9, 14, 17, 11, 19, 13, 16] },
    ],
  },

  adminInitiatives: [
    { id: 1, title: "Library Resource Expansion", goal: 125000, icon: "library", active: true },
    { id: 2, title: "Digital Learning Lab", goal: 150000, icon: "laptop", active: true },
    { id: 3, title: "CST Merit Scholarship Fund", goal: 250000, icon: "graduation", active: true },
  ],

  // type: Financial Support | Equipment & Resources | Scholarship | Infrastructure | Other
  // value is the amount in Nu. (estimated value for donated items)
  adminContributions: [
    { id: 1, donor: "Tandin Dorji", donorType: "Alumni", batch: "2021", email: "tandin.dorji@example.com", type: "Financial Support", details: "Nu. 50,000", value: 50000, date: "2026-10-14", status: "Verified", initiativeId: 1, note: "Bank transfer received.", reason: "" },
    { id: 2, donor: "Bhutan Power Corporation", donorType: "Organization", batch: "", email: "csr@bpc.bt", type: "Equipment & Resources", details: "Laptops (5 units)", value: 75000, date: "2026-10-12", status: "Pending", initiativeId: 2, note: "Delivery to the IT department is scheduled for next week.", reason: "" },
    { id: 3, donor: "Chimi Dema", donorType: "Alumni", batch: "2019", email: "chimi.dema@example.com", type: "Scholarship", details: "Nu. 100,000", value: 100000, date: "2026-10-10", status: "Verified", initiativeId: 3, note: "For two final-year students in need.", reason: "" },
    { id: 4, donor: "Jigme Dorji", donorType: "Alumni", batch: "2020", email: "jigme.dorji@example.com", type: "Infrastructure", details: "Library Renovation", value: 40000, date: "2026-10-08", status: "Rejected", initiativeId: 1, note: "", reason: "Payment slip could not be matched with a bank record." },
    { id: 5, donor: "DrukTech Solutions", donorType: "Organization", batch: "", email: "hello@druktech.bt", type: "Other", details: "Project Support (for AI Lab)", value: 30000, date: "2026-10-05", status: "Verified", initiativeId: 2, note: "Sponsorship of two AI Lab projects.", reason: "" },
    { id: 6, donor: "TechNova Pvt. Ltd.", donorType: "Organization", batch: "", email: "accounts@technova.bt", type: "Financial Support", details: "Nu. 75,000", value: 75000, date: "2026-10-11", status: "Pending", initiativeId: 3, note: "Cheque deposited, waiting for bank confirmation.", reason: "" },
    { id: 7, donor: "Anonymous Donor", donorType: "Anonymous", batch: "", email: "", type: "Equipment & Resources", details: "Books & Resources", value: 20000, date: "2026-10-10", status: "Pending", initiativeId: 1, note: "Box of reference books left at the library desk.", reason: "" },
    { id: 8, donor: "Karma Tshering", donorType: "Alumni", batch: "2018", email: "karma.tshering@example.com", type: "Financial Support", details: "Nu. 25,000", value: 25000, date: "2026-09-28", status: "Verified", initiativeId: 3, note: "", reason: "" },
    { id: 9, donor: "Sonam Wangmo", donorType: "Alumni", batch: "2020", email: "sonam.wangmo@example.com", type: "Scholarship", details: "Nu. 30,000", value: 30000, date: "2026-09-20", status: "Verified", initiativeId: 3, note: "", reason: "" },
    { id: 10, donor: "Pema Lhaki", donorType: "Alumni", batch: "2022", email: "pema.lhaki@example.com", type: "Equipment & Resources", details: "Projector and screen", value: 18000, date: "2026-09-12", status: "Verified", initiativeId: 2, note: "", reason: "" },
    { id: 11, donor: "Ugyen Phuntsho", donorType: "Alumni", batch: "2017", email: "ugyen.phuntsho@example.com", type: "Financial Support", details: "Nu. 15,000", value: 15000, date: "2026-09-03", status: "Verified", initiativeId: 1, note: "", reason: "" },
    { id: 12, donor: "Himal Telecom", donorType: "Organization", batch: "", email: "support@himaltelecom.bt", type: "Equipment & Resources", details: "Networking switches (4 units)", value: 60000, date: "2026-10-09", status: "Pending", initiativeId: 2, note: "For the new Digital Learning Lab.", reason: "" },
    { id: 13, donor: "Dechen Zam", donorType: "Alumni", batch: "2023", email: "dechen.zam@example.com", type: "Financial Support", details: "Nu. 10,000", value: 10000, date: "2026-10-08", status: "Pending", initiativeId: 3, note: "", reason: "" },
    { id: 14, donor: "Rinzin Gyeltshen", donorType: "Alumni", batch: "2016", email: "rinzin.g@example.com", type: "Infrastructure", details: "Reading hall furniture", value: 35000, date: "2026-08-30", status: "Verified", initiativeId: 1, note: "", reason: "" },
    { id: 15, donor: "Namgay Om", donorType: "Alumni", batch: "2019", email: "namgay.om@example.com", type: "Financial Support", details: "Nu. 5,000", value: 5000, date: "2026-08-22", status: "Rejected", initiativeId: 3, note: "", reason: "Duplicate of an earlier submission." },
  ],

  // Role: Student | Alumni | Staff | Administrator
  // Status: Active | Pending | Suspended
  adminUsers: [
    { id: 1, name: "Tashi Wangdi", email: "tashi.wangdi@cst.edu.bt", role: "Administrator", status: "Active", joined: "2024-01-10", detail: "System Administration" },
    { id: 2, name: "Dechen Pelden", email: "dechen.pelden@cst.edu.bt", role: "Staff", status: "Active", joined: "2024-02-02", detail: "Alumni Relations" },
    { id: 3, name: "Tandin Dorji", email: "tandin.dorji@example.com", role: "Alumni", status: "Active", joined: "2025-03-14", detail: "Civil Engineering, 2021" },
    { id: 4, name: "Chimi Dema", email: "chimi.dema@example.com", role: "Alumni", status: "Active", joined: "2025-03-20", detail: "Electrical Engineering, 2019" },
    { id: 5, name: "Karma Wangchuk", email: "karma.wangchuk@example.com", role: "Alumni", status: "Pending", joined: "2026-10-18", detail: "Civil Engineering, 2021" },
    { id: 6, name: "Tashi Lhamo", email: "tashi.lhamo@example.com", role: "Alumni", status: "Pending", joined: "2026-10-17", detail: "Electrical Engineering, 2019" },
    { id: 7, name: "Jigme Namgyel", email: "jigme.namgyel@example.com", role: "Alumni", status: "Pending", joined: "2026-10-14", detail: "Computer Science & Engineering, 2023" },
    { id: 8, name: "Pema Choden", email: "pema.choden@cst.edu.bt", role: "Student", status: "Active", joined: "2026-08-05", detail: "Information Technology, Year 3" },
    { id: 9, name: "Tenzin Wangmo", email: "tenzin.wangmo@cst.edu.bt", role: "Student", status: "Active", joined: "2026-08-06", detail: "Software Engineering, Year 3" },
    { id: 10, name: "Karma Jamtsho", email: "karma.jamtsho@cst.edu.bt", role: "Student", status: "Active", joined: "2026-08-09", detail: "Information Technology, Year 4" },
    { id: 11, name: "Sonam Pelden", email: "sonam.pelden@cst.edu.bt", role: "Student", status: "Suspended", joined: "2026-08-12", detail: "Electronics & Communication, Year 2" },
    { id: 12, name: "Ugyen Tshering", email: "ugyen.tshering@cst.edu.bt", role: "Student", status: "Active", joined: "2026-08-15", detail: "Civil Engineering, Year 4" },
    { id: 13, name: "Sonam Choki", email: "sonam.choki@example.com", role: "Alumni", status: "Active", joined: "2025-06-02", detail: "Electronics & Communication, 2018" },
    { id: 14, name: "Kinley Zangmo", email: "kinley.zangmo@example.com", role: "Alumni", status: "Active", joined: "2025-07-19", detail: "Architecture, 2021" },
    { id: 15, name: "Pema Dema", email: "pema.dema@example.com", role: "Staff", status: "Active", joined: "2025-11-04", detail: "Registrar's Office" },
  ],

  adminStaffVerifications: [
    { id: 1, name: "Tashi Dorji", email: "tashi.dorji@cst.edu.bt", department: "Computer Science", registeredAt: "2026-10-22T10:24:00", status: "Pending Review" },
    { id: 2, name: "Phuntsho Choden", email: "phuntsho.choden@cst.edu.bt", department: "Electrical Engineering", registeredAt: "2026-10-21T15:17:00", status: "Pending Review" },
    { id: 3, name: "Karma Jamtsho", email: "karma.jamtsho@cst.edu.bt", department: "Mechanical Engineering", registeredAt: "2026-10-20T11:42:00", status: "Pending Review" },
    { id: 4, name: "Dechen Sangay", email: "dechen.sangay@cst.edu.bt", department: "Mathematics", registeredAt: "2026-10-19T14:36:00", status: "Pending Review" },
    { id: 5, name: "Namgay Bhutia", email: "namgay.bhutia@cst.edu.bt", department: "Information Technology", registeredAt: "2026-10-18T09:55:00", status: "Rejected" },
    { id: 6, name: "Lhamo Tshering", email: "lhamo.tshering@cst.edu.bt", department: "Civil Engineering", registeredAt: "2026-10-17T16:20:00", status: "Approved" },
    { id: 7, name: "Sonam Gyeltshen", email: "sonam.gyeltshen@cst.edu.bt", department: "Administration", registeredAt: "2026-10-16T13:12:00", status: "Pending Review" },
  ],

  // Type: Job | Internship   Status: Approved | Pending | Rejected | Closed
  adminOpportunities: [
    { id: 1, title: "Software Engineer", type: "Job", company: "DrukTech", postedBy: "Alumni", location: "Thimphu", deadline: "2026-11-20", status: "Approved", description: "Build and maintain web services for government clients." },
    { id: 2, title: "Frontend Intern", type: "Internship", company: "Bhutan Infotech", postedBy: "Admin", location: "Thimphu", deadline: "2026-11-15", status: "Approved", description: "Three-month internship on a React product team." },
    { id: 3, title: "UI/UX Designer", type: "Job", company: "Bhutan FinTech", postedBy: "Alumni", location: "Thimphu", deadline: "2026-12-01", status: "Approved", description: "Design mobile banking screens and run usability tests." },
    { id: 4, title: "Backend Developer Intern", type: "Internship", company: "TechStart", postedBy: "Admin", location: "Paro", deadline: "2026-11-30", status: "Pending", description: "Work with Node.js and MySQL on internal tools." },
    { id: 5, title: "Site Engineer", type: "Job", company: "Druk Builders", postedBy: "Alumni", location: "Paro", deadline: "2026-11-25", status: "Pending", description: "Supervise structural works on residential projects." },
    { id: 6, title: "Web Development Intern", type: "Internship", company: "Druk Green Power Corporation", postedBy: "Alumni", location: "Thimphu", deadline: "2026-11-30", status: "Approved", description: "Internal dashboards using React and Node.js." },
    { id: 7, title: "Network Engineer", type: "Job", company: "Himal Telecom", postedBy: "Alumni", location: "Phuntsholing", deadline: "2026-10-10", status: "Closed", description: "Manage regional network infrastructure." },
    { id: 8, title: "Marketing Associate", type: "Job", company: "QuickBuck Ltd.", postedBy: "Alumni", location: "Thimphu", deadline: "2026-11-18", status: "Rejected", description: "Posting did not describe a real role." },
  ],

  // Status: Pending | Approved | Rejected | Cancelled
  adminEvents: [
    { id: 1, title: "Alumni Career Talk 2026", organizer: "Alumni Relations", venue: "CST Auditorium", dateTime: "2026-10-30T10:00", status: "Approved", expected: 120 },
    { id: 2, title: "Career Fair 2026", organizer: "Career Office", venue: "CST Campus", dateTime: "2026-11-03T09:00", status: "Approved", expected: 400 },
    { id: 3, title: "Networking Night", organizer: "Tandin Dorji (Alumni)", venue: "Hotel Druk, Thimphu", dateTime: "2026-11-12T18:00", status: "Pending", expected: 80 },
    { id: 4, title: "Alumni Homecoming", organizer: "Alumni Relations", venue: "CST Auditorium", dateTime: "2026-11-21T16:00", status: "Approved", expected: 300 },
    { id: 5, title: "Tech Talk: AI in Bhutan", organizer: "IT Department", venue: "Seminar Hall", dateTime: "2026-12-05T14:00", status: "Approved", expected: 150 },
    { id: 6, title: "Startup Pitch Evening", organizer: "Chimi Dema (Alumni)", venue: "CST Library Hall", dateTime: "2026-11-27T17:00", status: "Pending", expected: 60 },
    { id: 7, title: "Freshers' Welcome 2026", organizer: "Student Affairs", venue: "CST Ground", dateTime: "2026-08-20T10:00", status: "Approved", expected: 250 },
    { id: 8, title: "Weekend Trek", organizer: "Sports Club", venue: "Dochula", dateTime: "2026-11-08T07:00", status: "Rejected", expected: 40 },
  ],

  adminNotifications: [
    { id: 1, type: "Contribution", message: "5 contributions are waiting for verification.", createdAt: "2026-10-25T09:00:00", isRead: false },
    { id: 2, type: "Alumni", message: "3 new alumni accounts are waiting for approval.", createdAt: "2026-10-24T16:30:00", isRead: false },
    { id: 3, type: "Event", message: "Networking Night was submitted for approval.", createdAt: "2026-10-23T11:10:00", isRead: false },
    { id: 4, type: "Opportunity", message: "Backend Developer Intern at TechStart needs approval.", createdAt: "2026-10-22T14:45:00", isRead: true },
    { id: 5, type: "Report", message: "A post in the Alumni Hub was reported by a student.", createdAt: "2026-10-21T08:20:00", isRead: true },
  ],

  adminSettings: {
    emailNotifications: true,
    contributionAlerts: true,
    approvalAlerts: true,
    weeklyDigest: false,
    requireEventApproval: true,
    requireOpportunityApproval: true,
  },

  adminProfile: {
    name: "Tashi Wangdi",
    email: "tashi.wangdi@cst.edu.bt",
    phone: "17100001",
  },
};
