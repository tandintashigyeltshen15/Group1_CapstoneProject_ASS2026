const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

async function main() {
  const [name, email, username, password] = process.argv.slice(2);

  if (!name || !email || !username || !password) {
    console.log('Usage: node scripts/create-admin.js "Full Name" email username password');
    process.exit(1);
  }
  if (password.length < 8) {
    console.log("Password must be at least 8 characters.");
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { RoleName: "Administrator" } });
  if (!role) {
    console.log("Administrator role not found. Run the seed script first.");
    process.exit(1);
  }

  const user = await prisma.user.create({
    data: {
      RoleID: role.RoleID,
      Username: username.trim(),
      Password: await bcrypt.hash(password, 10),
      Name: name.trim(),
      Email: email.trim().toLowerCase(),
      AccountStatus: "Active",
    },
  });

  console.log(`Admin created: ${user.Email} (UserID ${user.UserID})`);
}

main()
  .catch((err) => {
    if (err.code === "P2002") console.log("That email or username already exists.");
    else console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());