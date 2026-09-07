import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL is used for migrations (can point to superuser if needed)
    // DATABASE_URL is used by the app at runtime via the pg adapter
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
