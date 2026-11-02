const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();

    console.log("Database connected successfully!");
    console.log("Roles:", roles);
}

main()
    .catch((error) => {
        console.error("Database test failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });