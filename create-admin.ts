import prisma from "./server/db.js";
import bcrypt from "bcrypt";

async function main() {
  const email = "admin@marketplace.com";
  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const password = await bcrypt.hash("admin123", salt);
  
  // Create or update the admin user
  const admin = await prisma.user.upsert({
    where: { email },
    update: { 
      role: "ADMIN",
      password // Update password to ensure it's admin123
    },
    create: {
      email,
      password,
      role: "ADMIN",
      firstName: "System",
      lastName: "Admin",
      isVerifiedBadge: true,
      emailVerified: true,
    }
  });
  
  console.log("✅ Admin user created/updated successfully!");
  console.log("📧 Email:", email);
  console.log("🔑 Password: admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
