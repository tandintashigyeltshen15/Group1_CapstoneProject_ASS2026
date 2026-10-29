const { PrismaClient } = require("@prisma/client");

// One shared client for the whole app
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

module.exports = prisma;