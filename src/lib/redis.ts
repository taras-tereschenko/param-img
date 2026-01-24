import { Redis } from "@upstash/redis";

// Shared Redis client with lazy initialization
let redis: Redis | null = null;
let initAttempted = false;

/**
 * Get the shared Redis client instance.
 * Returns null if Upstash is not configured.
 *
 * Setup: https://console.upstash.com/
 * Required env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
export function getRedis(): Redis | null {
  // Only attempt initialization once
  if (initAttempted) return redis;
  initAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "Upstash Redis not configured. Rate limiting and webhook idempotency disabled.\n" +
        "To enable, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.\n" +
        "Get these from: https://console.upstash.com/",
    );
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}
