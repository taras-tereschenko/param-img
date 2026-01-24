import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortal } from "@polar-sh/tanstack-start";
import { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { getPolarCustomerId } from "@/lib/polar-user";

export const Route = createFileRoute("/api/polar/portal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Get Better Auth session
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          const url = new URL(request.url);
          return Response.redirect(url.origin + "/?error=auth_required");
        }

        const polarCustomerId = await getPolarCustomerId(session.user.id);

        if (!polarCustomerId) {
          const url = new URL(request.url);
          return Response.redirect(url.origin + "/?error=no_polar_customer");
        }

        const env = getEnv();
        return CustomerPortal({
          accessToken: env.POLAR_ACCESS_TOKEN,
          server: env.POLAR_SERVER,
          getCustomerId: () => Promise.resolve(polarCustomerId),
          returnUrl: "/",
        })(request);
      },
    },
  },
});
