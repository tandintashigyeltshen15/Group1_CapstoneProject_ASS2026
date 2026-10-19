const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "CST Alumni Portal Backend is running"
    });
});

// Test database connection (mysql2)
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            message: "Database connected successfully",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Test database connection (Prisma)
app.get("/api/health", async (req, res) => {
    try {
        const roles = await prisma.role.findMany();

        res.json({
            message: "Backend and database are connected!",
            roles: roles
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});