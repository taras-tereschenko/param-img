/**
 * Script to add credits to a user via Polar API
 *
 * Usage:
 *   bun scripts/add-credits.ts <email> <amount>
 *
 * Example:
 *   bun scripts/add-credits.ts user@example.com 100
 */

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
});

const METER_SLUG = "ai_enhancement";

async function addCredits(email: string, amount: number) {
  // Find customer by email
  const customers = await polar.customers.list({ email });

  if (customers.result.items.length === 0) {
    console.error(`No customer found with email: ${email}`);
    process.exit(1);
  }

  const customer = customers.result.items[0];
  console.log(`Found customer: ${customer.id} (${customer.email})`);

  // Ingest negative event to add credits
  await polar.events.ingest({
    events: [
      {
        customerId: customer.id,
        name: METER_SLUG,
        metadata: { units: -amount }, // Negative = add credits
      },
    ],
  });

  console.log(`✓ Added ${amount} credits to ${email}`);

  // Show current balance
  const meterId = process.env.POLAR_METER_ID;
  if (meterId) {
    const quantities = await polar.meters.quantities({
      id: meterId,
      customerId: customer.id,
      startTimestamp: new Date("2024-01-01"),
      endTimestamp: new Date(),
      interval: "month",
    });
    const total = quantities.quantities.reduce((sum, q) => sum + q.quantity, 0);
    console.log(`Current balance: ${-total} credits`);
  }
}

// Parse CLI args
const [email, amountStr] = process.argv.slice(2);

if (!email || !amountStr) {
  console.log("Usage: bun scripts/add-credits.ts <email> <amount>");
  console.log("Example: bun scripts/add-credits.ts user@example.com 100");
  process.exit(1);
}

const amount = parseInt(amountStr, 10);
if (isNaN(amount) || amount <= 0) {
  console.error("Amount must be a positive number");
  process.exit(1);
}

addCredits(email, amount);
