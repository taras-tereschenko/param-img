/**
 * Environment variable validation
 * Validates required environment variables at startup to fail fast
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // Better Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  // Polar
  POLAR_ACCESS_TOKEN: string;
  POLAR_ORGANIZATION_ID: string;
  POLAR_SERVER: "sandbox" | "production";

  // Gemini AI
  GEMINI_API_KEY: string;

  // Polar Webhook (required for payment processing)
  POLAR_WEBHOOK_SECRET: string;
  POLAR_METER_ID?: string;
  POLAR_PRODUCT_STARTER_ID?: string;
  POLAR_PRODUCT_STANDARD_ID?: string;
  POLAR_PRODUCT_PRO_ID?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

const requiredEnvVars: ReadonlyArray<string> = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "POLAR_ACCESS_TOKEN",
  "POLAR_ORGANIZATION_ID",
  "POLAR_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
];

/**
 * Validates that all required environment variables are set.
 * Throws an error with details about missing variables.
 */
export function validateEnv(): EnvConfig {
  const missing: Array<string> = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const helpLinks: Record<string, string> = {
      DATABASE_URL: "Neon: https://console.neon.tech/",
      BETTER_AUTH_SECRET: "Generate: openssl rand -base64 32",
      BETTER_AUTH_URL: "Your app URL (e.g., http://localhost:3000)",
      GOOGLE_CLIENT_ID:
        "Google Cloud Console: https://console.cloud.google.com/apis/credentials",
      GOOGLE_CLIENT_SECRET:
        "Google Cloud Console: https://console.cloud.google.com/apis/credentials",
      POLAR_ACCESS_TOKEN: "Polar Dashboard: https://polar.sh/settings",
      POLAR_ORGANIZATION_ID: "Polar Dashboard > Settings > Organization",
      POLAR_WEBHOOK_SECRET: "Polar Dashboard > Settings > Webhooks",
      GEMINI_API_KEY: "Google AI Studio: https://aistudio.google.com/",
    };

    const details = missing.map((k) => {
      const help = helpLinks[k];
      return help ? `  - ${k}\n    ${help}` : `  - ${k}`;
    });

    throw new Error(
      `Missing required environment variables:\n${details.join("\n")}\n\n` +
        `Copy .env.example to .env and fill in the values.`,
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN!,
    POLAR_ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID!,
    POLAR_SERVER:
      process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET!,
    POLAR_METER_ID: process.env.POLAR_METER_ID,
    POLAR_PRODUCT_STARTER_ID: process.env.POLAR_PRODUCT_STARTER_ID,
    POLAR_PRODUCT_STANDARD_ID: process.env.POLAR_PRODUCT_STANDARD_ID,
    POLAR_PRODUCT_PRO_ID: process.env.POLAR_PRODUCT_PRO_ID,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

/**
 * Get a typed environment configuration.
 * Call validateEnv() at startup to ensure all required vars are set.
 */
export function getEnv(): EnvConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN!,
    POLAR_ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID!,
    POLAR_SERVER:
      process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET!,
    POLAR_METER_ID: process.env.POLAR_METER_ID,
    POLAR_PRODUCT_STARTER_ID: process.env.POLAR_PRODUCT_STARTER_ID,
    POLAR_PRODUCT_STANDARD_ID: process.env.POLAR_PRODUCT_STANDARD_ID,
    POLAR_PRODUCT_PRO_ID: process.env.POLAR_PRODUCT_PRO_ID,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}
