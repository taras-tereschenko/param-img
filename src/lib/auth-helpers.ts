/**
 * Authentication helper utilities
 */

import type { Session } from "./auth";

/**
 * Type guard to check if a session exists.
 * Useful for narrowing Session | null in API routes.
 */
export function hasSession(session: Session | null): session is Session {
  return session !== null;
}
