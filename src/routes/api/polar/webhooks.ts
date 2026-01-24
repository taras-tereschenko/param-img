import { createFileRoute } from "@tanstack/react-router";
import { Webhooks } from "@polar-sh/tanstack-start";
import type { WebhookOrderPaidPayload } from "@polar-sh/sdk/models/components/webhookorderpaidpayload";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhook-idempotency";
import { getEnv } from "@/lib/env";

async function handleOrderPaid(payload: WebhookOrderPaidPayload) {
  // payload.data is the Order object directly
  const order = payload.data;
  const orderId = order.id;

  // SECURITY: Check if already processed (prevent double-processing)
  if (await isWebhookProcessed(orderId)) {
    console.log(`Order ${orderId} already processed, skipping`);
    return;
  }

  // Mark as processed BEFORE any processing (prevent race condition)
  await markWebhookProcessed(orderId);

  // With Polar Meters, credits are automatically granted via Meter Credit benefits
  // attached to products in the Polar dashboard. No manual credit addition needed.
  // This webhook is kept for logging/monitoring purposes.
  console.log(
    `Order ${orderId} paid by customer ${order.customerId} - credits auto-granted by Polar Meters`,
  );
}

export const Route = createFileRoute("/api/polar/webhooks")({
  server: {
    handlers: {
      POST: Webhooks({
        webhookSecret: getEnv().POLAR_WEBHOOK_SECRET,
        onOrderPaid: handleOrderPaid,
      }),
    },
  },
});
