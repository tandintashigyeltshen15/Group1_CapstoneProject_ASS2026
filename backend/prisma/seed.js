const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findUnique({ where: { RoleName: "Administrator" } });
  const staffRole = await prisma.role.findUnique({ where: { RoleName: "Staff" } });
  const dept = await prisma.department.findUnique({ where: { DepartmentName: "Computing Technologies" } });
  if (!adminRole || !staffRole || !dept) throw new Error("Run database/seed.sql first.");

  const Password = await bcrypt.hash("Password123", 10);

  await prisma.user.upsert({
    where: { Email: "admin@cst.test" },
    update: {},
    create: {
      RoleID: adminRole.RoleID,
      Username: "admin",
      Password,
      Name: "System Admin",
      Email: "admin@cst.test",
      AccountStatus: "Active",
    },
  });

  await prisma.user.upsert({
    where: { Email: "staff@cst.test" },
    update: {},
    create: {
      RoleID: staffRole.RoleID,
      Username: "ST001",
      Password,
      Name: "Test Staff",
      Email: "staff@cst.test",
      AccountStatus: "Active",
      staff: {
        create: { StaffID: "ST001", DepartmentID: dept.DepartmentID, Designation: "Alumni Relations Officer" },
      },
    },
  });

  console.log("Seeded admin@cst.test and staff@cst.test (password: Password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());