import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);

    // Google OAuth - redirects to Google, then back to your app
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/", // Redirect after successful sign in
    });
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant="outline"
      className="w-full gap-2"
    >
      <HugeiconsIcon icon={GoogleIcon} />
      {loading ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
