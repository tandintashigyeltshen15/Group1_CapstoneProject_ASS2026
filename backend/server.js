require("dotenv").config(); // must come first so DATABASE_URL and JWT_SECRET are loaded
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth.routes");
const catalogRoutes = require("./routes/catalog.routes");
const errorHandler = require("./middleware/errorHandler");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({ message: "CST Alumni Portal Backend is running" });
});

// Checks the server and the database connection
app.get("/api/health", async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json({ message: "Backend and database are connected!", roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});