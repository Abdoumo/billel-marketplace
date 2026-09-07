import prisma from "./server/db.js";

async function main() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  console.log("Admins found:", admins.length);
  console.log(admins);
}

main().finally(() => prisma.$disconnect());
