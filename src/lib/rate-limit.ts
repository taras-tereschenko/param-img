import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

// Rate limiter for AI enhancement requests
// 10 requests per minute per user
let ratelimit: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const redis = getRedis();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
    analytics: true,
    prefix: "param-img:enhance",
  });

  return ratelimit;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a user
 * Returns null if rate limiting is not configured (always allows)
 */
export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult | null> {
  const limiter = getRateLimiter();

  if (!limiter) {
    return null; // Rate limiting not configured, allow all
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
