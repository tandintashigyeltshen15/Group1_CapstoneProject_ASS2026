
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("CST Alumni Portal Backend is running!");
});

// Test database connection through the API
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
