import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { getEnv } from "./env";

import { db } from "@/db";
import * as schema from "@/db/schema";

// Get typed environment variables
const env = getEnv();

export const auth = betterAuth({
  // CRITICAL: baseURL prevents redirect URI mismatches with Google OAuth
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  // Google OAuth provider
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  // Security settings
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // Add fields for Polar integration
  user: {
    additionalFields: {
      polarCustomerId: {
        type: "string",
        required: false,
      },
    },
  },
  // CRITICAL: TanStack Start cookie handling plugin (must be last)
  plugins: [tanstackStartCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
