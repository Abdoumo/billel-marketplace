import prisma from "./server/db.js";

async function main() {
  await prisma.user.updateMany({
    where: { kycStatus: "PENDING" },
    data: { kycStatus: "REJECTED" } 
  });
  console.log("Reset pending KYC to REJECTED");
}

main().catch(console.error).finally(() => prisma.$disconnect());
