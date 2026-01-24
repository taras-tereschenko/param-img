import { Polar } from "@polar-sh/sdk";

// Polar server environment (defaults to production)
const polarServer =
  process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";

// Polar client for server-side operations
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: polarServer,
});

// Product IDs for credit packs (set these in Polar dashboard)
export const CREDIT_PRODUCTS = {
  starter: process.env.POLAR_PRODUCT_STARTER_ID,
  standard: process.env.POLAR_PRODUCT_STANDARD_ID,
  pro: process.env.POLAR_PRODUCT_PRO_ID,
} as const;

// Meter slug for AI enhancements (created in Polar dashboard)
// Usage is tracked via events.ingest() and credits are auto-granted via Meter Credit benefits
export const METER_SLUG = "ai_enhancement";

// Free credits per month (tracked via customer metadata)
export const FREE_MONTHLY_CREDITS = 3;

// Customer metadata keys
export const CUSTOMER_METADATA = {
  freeCreditsGrantedAt: "free_credits_granted_at",
  betterAuthUserId: "better_auth_user_id",
} as const;

/**
 * Get Polar organization ID for customer creation.
 * Loaded lazily to avoid startup issues.
 */
export function getPolarOrganizationId(): string {
  const id = process.env.POLAR_ORGANIZATION_ID;
  if (!id) throw new Error("POLAR_ORGANIZATION_ID not configured");
  return id;
}

/**
 * Check if customer needs free credits this month.
 * Returns true if free credits should be granted.
 * Uses UTC to ensure consistent behavior across timezones.
 */
export function needsFreeCreditsThisMonth(
  metadata: Record<string, string | number | boolean> | null | undefined,
): boolean {
  if (!metadata) return true; // New customer

  const lastGranted = metadata[CUSTOMER_METADATA.freeCreditsGrantedAt];
  if (!lastGranted) return true;

  const lastGrantedDate = new Date(String(lastGranted));
  const now = new Date();

  // New month = needs credits
  return (
    lastGrantedDate.getUTCMonth() !== now.getUTCMonth() ||
    lastGrantedDate.getUTCFullYear() !== now.getUTCFullYear()
  );
}

/**
 * Get meter balance for a customer.
 * Uses meters.quantities to get the actual sum aggregation value.
 * Negative sum = credits available (we ingest -3 for 3 free credits).
 */
export async function getMeterBalance(customerId: string): Promise<number> {
  const meterId = process.env.POLAR_METER_ID;
  if (!meterId) {
    console.error("POLAR_METER_ID not configured");
    return 0;
  }

  // Query all meter events from a reasonable start date to now
  const quantities = await polar.meters.quantities({
    id: meterId,
    customerId,
    startTimestamp: new Date("2024-01-01"),
    endTimestamp: new Date(),
    interval: "month",
  });

  // Sum all quantities for this customer
  // Negative = credits available, positive = credits used
  // Negate to get available credits (e.g., sum of -3 means 3 credits)
  const total = quantities.quantities.reduce((sum, q) => sum + q.quantity, 0);
  return -total;
}
