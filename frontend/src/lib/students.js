/* ------------------------------------------------------------------
   Sample student portfolios (read-only for alumni).
   Matches the Student_Profile + Student_Portfolio tables:
   Projects, TechnicalSkills and SoftSkills are TEXT columns in MySQL;
   here they are arrays so the page can show them nicely.
   When the backend is ready, replace getStudent() with an API call.
------------------------------------------------------------------- */
export const STUDENTS = {
  "02210045": {
    name: "Pema Choden", programme: "B.E. in Information Technology", yearOfJoining: 2021,
    projects: [
      { title: "Campus Event Finder", description: "Mobile-friendly site listing college events with reminders.", tech: ["React", "Firebase"], link: "github.com/pema-choden/event-finder" },
      { title: "Library Book Tracker", description: "Tracks borrowed books and due dates for the CST library.", tech: ["HTML", "CSS", "JavaScript"], link: "" },
    ],
    technicalSkills: ["JavaScript", "React", "HTML/CSS", "Git"],
    softSkills: ["Teamwork", "Communication", "Time management"],
  },
  "02210112": {
    name: "Tenzin Wangmo", programme: "B.E. in Information Technology", yearOfJoining: 2021,
    projects: [
      { title: "Student Attendance System", description: "QR-code based attendance with a simple admin dashboard.", tech: ["Node.js", "MySQL"], link: "github.com/tenzin-wangmo/attendance" },
    ],
    technicalSkills: ["Node.js", "MySQL", "Python", "REST APIs"],
    softSkills: ["Problem solving", "Presentation", "Leadership"],
  },
  "02200078": {
    name: "Karma Jamtsho", programme: "B.E. in Computer Science", yearOfJoining: 2020,
    projects: [
      { title: "Cloud File Backup Tool", description: "Command-line tool that backs up folders to cloud storage.", tech: ["Python", "AWS S3"], link: "github.com/karma-jamtsho/cloud-backup" },
      { title: "Network Monitoring Dashboard", description: "Shows live status of lab computers on the campus network.", tech: ["Python", "Flask"], link: "" },
    ],
    technicalSkills: ["Python", "AWS", "Linux", "Networking"],
    softSkills: ["Adaptability", "Self-learning", "Teamwork"],
  },
  "02210201": {
    name: "Dechen Yangzom", programme: "B.E. in Information Technology", yearOfJoining: 2021,
    projects: [
      { title: "Farmers' Market Price App", description: "Lets farmers check daily vegetable prices in Thimphu.", tech: ["React Native"], link: "" },
    ],
    technicalSkills: ["React Native", "JavaScript", "UI design"],
    softSkills: ["Creativity", "Communication"],
  },
  "02210150": {
    name: "Sonam Pelden", programme: "B.E. in Information Technology", yearOfJoining: 2021,
    projects: [
      { title: "Portfolio Website Builder", description: "Template-based site builder for student portfolios.", tech: ["Next.js", "Tailwind CSS"], link: "github.com/sonam-pelden/portfolio-builder" },
      { title: "Weather Dashboard", description: "Weather and rainfall charts for Bhutanese dzongkhags.", tech: ["React", "Chart.js"], link: "" },
    ],
    technicalSkills: ["Next.js", "React", "Tailwind CSS", "Git"],
    softSkills: ["Creativity", "Teamwork", "Attention to detail"],
  },
  "02200033": {
    name: "Ugyen Tshering", programme: "B.E. in Computer Science", yearOfJoining: 2020,
    projects: [
      { title: "Inventory Management System", description: "Stock tracking for a small shop with sales reports.", tech: ["Java", "MySQL"], link: "" },
    ],
    technicalSkills: ["Java", "MySQL", "Spring Boot"],
    softSkills: ["Responsibility", "Communication", "Problem solving"],
  },
};

export const getStudent = (studentId) => STUDENTS[studentId] ?? null;
