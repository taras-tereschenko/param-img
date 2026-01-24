import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { polar } from "@/lib/polar";

// Map tier names to env var keys
const TIER_TO_PRODUCT_KEY = {
  starter: "POLAR_PRODUCT_STARTER_ID",
  standard: "POLAR_PRODUCT_STANDARD_ID",
  pro: "POLAR_PRODUCT_PRO_ID",
} as const;

/** Zod schema for tier validation - single source of truth */
const TierSchema = z.enum(["starter", "standard", "pro"]);

/**
 * Type guard for errors with Response-like objects (e.g., Polar SDK HTTPError).
 * Uses structural typing to safely narrow without casting.
 */
interface ErrorWithResponse extends Error {
  response: {
    status: number;
    text: () => Promise<string>;
  };
}

function hasResponse(error: Error): error is ErrorWithResponse {
  if (!("response" in error)) return false;
  const resp = error.response;
  if (resp === null || typeof resp !== "object") return false;
  if (!("status" in resp) || typeof resp.status !== "number") return false;
  if (!("text" in resp) || typeof resp.text !== "function") return false;
  return true;
}

export const Route = createFileRoute("/api/polar/checkout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const tierParam = url.searchParams.get("tier");
          const tierResult = TierSchema.safeParse(tierParam);
          let productId = url.searchParams.get("productId");

          const env = getEnv();

          // Resolve tier to productId if provided
          if (tierResult.success) {
            const envKey = TIER_TO_PRODUCT_KEY[tierResult.data];
            productId = env[envKey] ?? null;
          }

          // Validate productId is available
          if (!productId) {
            return Response.json(
              {
                error: "Missing product configuration",
                message: tierResult.success
                  ? `Product ID for tier "${tierResult.data}" not configured. Set ${TIER_TO_PRODUCT_KEY[tierResult.data]} in your .env file.`
                  : "Missing tier or productId parameter",
              },
              { status: 400 },
            );
          }

          // Get Better Auth session
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            // Redirect to home with error - user needs to sign in first
            return Response.redirect(url.origin + "/?error=auth_required");
          }

          // Create checkout with user ID in metadata for security verification
          const checkout = await polar.checkouts.create({
            products: [productId],
            successUrl: `${url.origin}/api/polar/checkout-success?checkoutId={CHECKOUT_ID}`,
            customerEmail: session.user.email,
            metadata: {
              // Store user ID to verify on checkout-success
              betterAuthUserId: session.user.id,
            },
          });

          // Redirect to Polar checkout URL
          return Response.redirect(checkout.url);
        } catch (error: unknown) {
          console.error("Checkout error:", error);
          // Try to extract more details from Polar HTTPError
          let details = "Unknown error";
          if (error instanceof Error) {
            details = error.message;
            // Use type guard to safely access Response-like properties
            if (hasResponse(error)) {
              console.error("Polar response status:", error.response.status);
              try {
                const body = await error.response.text();
                console.error("Polar response body:", body);
                details = `${error.message}: ${body}`;
              } catch {
                // ignore
              }
            }
          }
          return Response.json(
            {
              error: "Checkout failed",
              message: details,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
