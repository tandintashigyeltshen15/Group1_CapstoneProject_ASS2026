require("dotenv").config(); // must come first so DATABASE_URL and JWT_SECRET are loaded
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./config/db");
const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth.routes");
const catalogRoutes = require("./routes/catalog.routes");
const legacyAuthRoutes = require("./routes/auth"); // the lead's original auth routes
const errorHandler = require("./middleware/errorHandler");
const alumniRoutes = require("./routes/alumni.routes");
const eventsRoutes = require("./routes/events.routes");
const staffPortalRoutes = require("./routes/staffPortal.routes");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/staff-signup", require("./routes/staff.routes"));
app.use("/api/catalog", require("./routes/catalog.routes"));
app.use("/api/events", eventsRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({ message: "CST Alumni Portal Backend is running" });
});

// Test database connection (mysql2)
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS database_name");
    res.json({ message: "Database connected successfully", database: rows[0].database_name });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Test database connection (Prisma)
app.get("/api/health", async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json({ message: "Backend and database are connected!", roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes); // register, login, me (checked first)
app.use("/api/auth", legacyAuthRoutes); // anything else the original auth file defines
app.use("/api/catalog", catalogRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/staff", staffPortalRoutes); // staff portal routes (requires auth)

app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});