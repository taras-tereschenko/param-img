import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { getMeterBalance } from "@/lib/polar";
import { ensurePolarCustomerWithFreeCredits } from "@/lib/polar-user";

export interface CreditsData {
  credits: number;
  customerId: string | null;
  isAuthenticated: boolean;
}

export const getCredits = createServerFn({ method: "GET" }).handler(
  async (): Promise<CreditsData> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return { credits: 0, customerId: null, isAuthenticated: false };
    }

    const { id: userId, email } = session.user;

    if (!email) {
      throw new Error("Email required for credits");
    }

    // This throws on error (no fake data)
    const { customerId } = await ensurePolarCustomerWithFreeCredits(
      userId,
      email,
    );
    const credits = await getMeterBalance(customerId);

    return { credits, customerId, isAuthenticated: true };
  },
);
