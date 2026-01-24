// IMPORTANT: Use "better-auth/react" for React hooks support
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Must match your server URL
  baseURL: import.meta.env.VITE_APP_URL || "http://localhost:3000",
});

// Export specific methods for cleaner imports
export const {
  signIn, // signIn.social({ provider: "google" })
  signOut, // signOut()
  useSession, // Hook: { data, isPending, error, refetch }
} = authClient;
