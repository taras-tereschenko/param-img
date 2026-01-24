import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Session } from "@/lib/auth";
import { auth } from "@/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session | null> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  },
);
