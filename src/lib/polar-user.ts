import { and, eq, isNull } from "drizzle-orm";

import {
  CUSTOMER_METADATA,
  FREE_MONTHLY_CREDITS,
  METER_SLUG,
  needsFreeCreditsThisMonth,
  polar,
} from "./polar";

import { db, users } from "@/db";

/**
 * Link Polar customer to Better Auth user after checkout.
 * Uses optimistic locking to prevent duplicate linking.
 */
export async function linkPolarCustomer(
  userId: string,
  polarCustomerId: string,
): Promise<void> {
  // Only update if polarCustomerId is null to prevent overwriting
  await db
    .update(users)
    .set({ polarCustomerId })
    .where(and(eq(users.id, userId), isNull(users.polarCustomerId)));
}

/**
 * Get Polar customer ID for a user
 */
export async function getPolarCustomerId(
  userId: string,
): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { polarCustomerId: true },
  });
  return user?.polarCustomerId ?? null;
}

/**
 * Ensure user has a Polar customer and free credits for this month.
 *
 * This function handles:
 * 1. Checking if user already has a linked Polar customer
 * 2. Checking if a Polar customer exists with same email (from previous checkout)
 * 3. Creating new Polar customer if needed
 * 4. Granting monthly free credits if not yet granted this month
 *
 * Security: To mitigate race conditions on credit granting, we:
 * 1. Mark credits as granted BEFORE actually granting (optimistic)
 * 2. If the grant fails, the user just won't get credits this request
 * 3. Worst case race condition: user gets double credits (acceptable)
 */
export async function ensurePolarCustomerWithFreeCredits(
  userId: string,
  email: string,
): Promise<{ customerId: string; grantedCredits: boolean }> {
  let customerId = await getPolarCustomerId(userId);
  let customer = null;
  let grantedCredits = false;

  // Step 1: Check if user already has a linked Polar customer
  if (customerId) {
    customer = await polar.customers.get({ id: customerId });
  } else {
    // Step 2: Check if Polar customer exists with this email (from previous checkout)
    try {
      const existingCustomers = await polar.customers.list({ email });
      if (existingCustomers.result.items.length > 0) {
        customer = existingCustomers.result.items[0];
        customerId = customer.id;
        await linkPolarCustomer(userId, customerId);
      }
    } catch (error: unknown) {
      console.error("Failed to check existing Polar customer:", error);
    }
  }

  // Step 3: Create new customer if none exists
  if (!customerId) {
    customer = await polar.customers.create({
      email,
      metadata: {
        [CUSTOMER_METADATA.betterAuthUserId]: userId,
        // Mark as granted immediately for new customers
        [CUSTOMER_METADATA.freeCreditsGrantedAt]: new Date().toISOString(),
      },
    });
    customerId = customer.id;
    await linkPolarCustomer(userId, customerId);

    // Grant initial free credits for new customer
    await polar.events.ingest({
      events: [
        {
          customerId,
          name: METER_SLUG,
          metadata: { units: -FREE_MONTHLY_CREDITS },
        },
      ],
    });
    grantedCredits = true;
  } else if (needsFreeCreditsThisMonth(customer?.metadata)) {
    // Step 4: Grant free credits if needed this month
    // Mark as granted FIRST (optimistic - reduces race condition window)
    await polar.customers.update({
      id: customerId,
      customerUpdate: {
        metadata: {
          ...(customer?.metadata ?? {}), // Type-safe spread
          [CUSTOMER_METADATA.freeCreditsGrantedAt]: new Date().toISOString(),
        },
      },
    });

    // Then grant credits
    await polar.events.ingest({
      events: [
        {
          customerId,
          name: METER_SLUG,
          metadata: { units: -FREE_MONTHLY_CREDITS },
        },
      ],
    });
    grantedCredits = true;
  }

  return { customerId, grantedCredits };
}
