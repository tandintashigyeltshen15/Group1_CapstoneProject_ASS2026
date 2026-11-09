// CST departments and programmes (source: https://cst.edu.bt/department/ and /programmes/).
// Used as a fallback when the backend catalog is empty or unreachable.
// The ids follow the order below, so the database rows must use the same ids.

export const DEPARTMENTS = [
  { id: 1, name: "Architecture Department" },
  { id: 2, name: "Civil & Environmental Engineering Department" },
  { id: 3, name: "Computing Technologies Department" },
  { id: 4, name: "Electrical & Electronics Engineering Department" },
  { id: 5, name: "Mechanical Engineering Department" },
  { id: 6, name: "Science & Humanities Department" },
];

export const PROGRAMMES = [
  // Bachelor's programmes
  { id: 1, name: "Civil Engineering" },
  { id: 2, name: "Electrical Engineering" },
  { id: 3, name: "Electronics and Communication" },
  { id: 4, name: "Information Technology" },
  { id: 5, name: "Architecture" },
  { id: 6, name: "Engineering Geology" },
  { id: 7, name: "Instrumentation and Control Engineering" },
  { id: 8, name: "Water Resource Engineering" },
  { id: 9, name: "Mechanical Engineering" },
  { id: 10, name: "Software Engineering" },
  // Master's programmes
  { id: 11, name: "Master of Engineering in Renewable Energy" },
  { id: 12, name: "Master in Construction Management" },
  { id: 13, name: "Master of Science in Engineering (MSc. Eng)" },
];