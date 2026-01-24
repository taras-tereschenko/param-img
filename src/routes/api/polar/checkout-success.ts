import { createFileRoute } from "@tanstack/react-router";
import { polar } from "@/lib/polar";
import { auth } from "@/lib/auth";
import { linkPolarCustomer } from "@/lib/polar-user";

// UUID v4 format validation for Polar checkout IDs
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidCheckoutId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export const Route = createFileRoute("/api/polar/checkout-success")({
  server: {
    handlers: {
      GET: async ({ request }): Promise<Response> => {
        const url = new URL(request.url);
        const checkoutId = url.searchParams.get("checkoutId");
        const baseUrl = url.origin;

        if (!checkoutId) {
          console.warn("Checkout success called without checkoutId");
          return Response.redirect(baseUrl + "/?error=no_checkout_id");
        }

        // Validate checkoutId format before API call
        if (!isValidCheckoutId(checkoutId)) {
          console.warn(`Invalid checkoutId format: ${checkoutId}`);
          return Response.redirect(baseUrl + "/?error=invalid_checkout_id");
        }

        try {
          // Verify checkout with Polar
          const checkout = await polar.checkouts.get({ id: checkoutId });

          if (checkout.status !== "succeeded") {
            console.warn(
              `Checkout ${checkoutId} status is "${checkout.status}", not "succeeded"`,
            );
            return Response.redirect(baseUrl + "/?error=checkout_incomplete");
          }

          const polarCustomerId = checkout.customerId;
          if (!polarCustomerId) {
            console.error(
              `Checkout ${checkoutId} succeeded but has no customer ID`,
            );
            return Response.redirect(baseUrl + "/?error=no_customer");
          }

          // Get Better Auth session
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (session?.user) {
            // Security: Verify the checkout was initiated by this user
            // The betterAuthUserId metadata MUST be present and match the current user
            const checkoutUserId = checkout.metadata.betterAuthUserId;
            if (typeof checkoutUserId !== "string") {
              console.warn(
                `Checkout ${checkoutId} missing betterAuthUserId metadata - cannot verify ownership`,
              );
              return Response.redirect(baseUrl + "/?error=invalid_checkout");
            }

            if (checkoutUserId !== session.user.id) {
              console.warn(
                `Checkout ${checkoutId} user mismatch: checkout belongs to ${checkoutUserId}, but ${session.user.id} is trying to claim it`,
              );
              return Response.redirect(baseUrl + "/?error=user_mismatch");
            }

            // Link Polar customer to Better Auth user
            await linkPolarCustomer(session.user.id, polarCustomerId);
          }

          return Response.redirect(baseUrl + "/?success=credits_added");
        } catch (error: unknown) {
          console.error("Checkout verification failed:", error);
          return Response.redirect(baseUrl + "/?error=verification_failed");
        }
      },
    },
  },
});
