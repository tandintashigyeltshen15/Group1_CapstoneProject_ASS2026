require("dotenv").config();
const prisma = require("../config/prisma");

async function main() {
  const total = await prisma.user.count();
  const some = await prisma.user.findMany({
    take: 3,
    select: { UserID: true, Username: true, Name: true },
  });
  console.log("Total users:", total);
  console.log(some);

  // Relation test
  const withRole = await prisma.user.findFirst({ include: { role: true } });
  console.log(withRole);
}

main()
  .catch((e) => console.error("Prisma error:", e))
  .finally(() => prisma.$disconnect());