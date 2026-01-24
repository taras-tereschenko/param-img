import { getRedis } from "./redis";

// TTL for idempotency keys (7 days)
const WEBHOOK_TTL = 60 * 60 * 24 * 7;

/**
 * Check if a webhook has already been processed
 * Returns true if already processed, false if new
 */
export async function isWebhookProcessed(orderId: string): Promise<boolean> {
  const client = getRedis();

  // If Redis is not configured, skip idempotency check (allow processing)
  // Note: This is safe because the webhook handler only logs - credits are managed by Polar
  if (!client) {
    console.warn(
      `[webhook-idempotency] Redis not configured, skipping idempotency check for order ${orderId}`,
    );
    return false;
  }

  const key = `webhook:order:${orderId}`;
  const exists = await client.exists(key);
  return exists === 1;
}

/**
 * Mark a webhook as processed
 * Should be called BEFORE processing to prevent race conditions
 */
export async function markWebhookProcessed(orderId: string): Promise<void> {
  const client = getRedis();

  // If Redis is not configured, skip marking
  // Note: This is safe because the webhook handler only logs - credits are managed by Polar
  if (!client) {
    console.warn(
      `[webhook-idempotency] Redis not configured, cannot mark order ${orderId} as processed`,
    );
    return;
  }

  const key = `webhook:order:${orderId}`;
  await client.set(key, "processed", { ex: WEBHOOK_TTL });
}
