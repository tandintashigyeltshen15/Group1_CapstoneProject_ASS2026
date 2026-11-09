const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const profile = require("../controllers/alumniProfile.controller");
const mentorship = require("../controllers/alumniMentorship.controller");
const opportunity = require("../controllers/alumniOpportunity.controller");

// Rate limit: 100 write requests (POST, PUT, PATCH, DELETE) per 15 minutes per IP.
// Reading (GET) is not limited.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: { message: "Too many requests. Please try again later." },
});

const alumniOnly = requireRole("Alumni");
const anyRole = requireRole("Student", "Alumni", "Staff", "Administrator");

router.use(writeLimiter);
router.use(authenticate); // every alumni route needs a login

/* ---- Own profile (Alumni only). These come BEFORE "/:id" so "me" is not read as an id ---- */
router.get("/me", alumniOnly, profile.getMyProfile);
router.put("/me", alumniOnly, profile.updateMyProfile);
router.get("/me/dashboard", alumniOnly, profile.getDashboard);

router.post("/me/career", alumniOnly, profile.addCareer);
router.put("/me/career/:id", alumniOnly, profile.updateCareer);
router.delete("/me/career/:id", alumniOnly, profile.deleteCareer);

router.post("/me/projects", alumniOnly, profile.addProject);
router.put("/me/projects/:id", alumniOnly, profile.updateProject);
router.delete("/me/projects/:id", alumniOnly, profile.deleteProject);

router.post("/me/publications", alumniOnly, profile.addPublication);
router.put("/me/publications/:id", alumniOnly, profile.updatePublication);
router.delete("/me/publications/:id", alumniOnly, profile.deletePublication);

router.post("/me/contributions", alumniOnly, profile.addContribution);
router.put("/me/contributions/:id", alumniOnly, profile.updateContribution);
router.delete("/me/contributions/:id", alumniOnly, profile.deleteContribution);

/* ---- Mentorship requests (Alumni only) ---- */
router.get("/me/mentorship-requests", alumniOnly, mentorship.listMyRequests);
router.get("/me/mentorship-requests/:id", alumniOnly, mentorship.getMyRequest);
router.patch("/me/mentorship-requests/:id", alumniOnly, mentorship.respondToRequest);

/* ---- Opportunities and applications (Alumni only) ---- */
router.get("/me/opportunities", alumniOnly, opportunity.listMyOpportunities);
router.post("/me/opportunities", alumniOnly, opportunity.createOpportunity);
router.put("/me/opportunities/:id", alumniOnly, opportunity.updateOpportunity);
router.patch("/me/opportunities/:id", alumniOnly, opportunity.setOpportunityStatus);
router.delete("/me/opportunities/:id", alumniOnly, opportunity.deleteOpportunity);
router.get("/me/opportunities/:id/applications", alumniOnly, opportunity.listApplications);
router.patch("/me/applications/:id", alumniOnly, opportunity.updateApplicationStatus);

/* ---- Alumni directory (any logged-in role) ---- */
router.get("/", anyRole, profile.listAlumni);
router.get("/:id", anyRole, profile.getAlumni);

module.exports = router;