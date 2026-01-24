import { defineConfig } from "drizzle-kit";

// Validate DATABASE_URL at config load time
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required for Drizzle.\n" +
      "Set it in your .env file or environment.\n" +
      "Example: DATABASE_URL=postgres://user:password@host/database?sslmode=require",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
