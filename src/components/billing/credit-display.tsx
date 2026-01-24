import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon, StarsIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";

interface CreditDisplayProps {
  onBuyCredits?: () => void;
}

export function CreditDisplay({ onBuyCredits }: CreditDisplayProps) {
  const { credits, isLoading: creditsLoading } = useCredits();
  // Use Better Auth's useSession hook
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  if (creditsLoading || sessionLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Spinner className="size-3.5" />
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Trigger Google OAuth sign-in
          authClient.signIn.social({
            provider: "google",
            callbackURL: window.location.pathname,
          });
        }}
      >
        <HugeiconsIcon icon={GoogleIcon} data-icon="inline-start" />
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onBuyCredits}
        title="AI Enhancement Credits"
      >
        <HugeiconsIcon
          icon={StarsIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {credits} credits
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => authClient.signOut()}
        title={`Sign out (${session.user.email})`}
      >
        Sign out
      </Button>
    </div>
  );
}
