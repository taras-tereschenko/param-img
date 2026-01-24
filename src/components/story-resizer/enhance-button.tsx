import { memo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBeautifyIcon,
  CheckmarkCircle02Icon,
  GoogleIcon,
} from "@hugeicons/core-free-icons";
import { BuyCreditsDrawer } from "./buy-credits-drawer";
import type { ProcessedImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCredits } from "@/hooks/use-credits";
import { authClient } from "@/lib/auth-client";

interface EnhanceButtonProps {
  image: ProcessedImage;
  onEnhance: () => void;
}

export const EnhanceButton = memo(function EnhanceButton({
  image,
  onEnhance,
}: EnhanceButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { credits, isAuthenticated, isLoading } = useCredits();
  const isEnhancing = image.enhancementStatus === "loading";

  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.pathname,
    });
  };

  // Enhanced result → checkmark icon, disabled status indicator
  if (image.isEnhancedResult) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
        className="rounded-full bg-background/80 backdrop-blur-sm"
      >
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Enhanced
      </Button>
    );
  }

  // Loading → spinner
  if (isLoading) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
        className="rounded-full bg-background/80 backdrop-blur-sm"
      >
        <Spinner className="size-4" />
      </Button>
    );
  }

  // Not authenticated → Google icon + "Log in to AI Enhance"
  if (!isAuthenticated) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
        onClick={handleSignIn}
      >
        <HugeiconsIcon
          icon={GoogleIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Log in to AI Enhance
      </Button>
    );
  }

  // No credits → Magic wand + "Buy credits"
  if (credits === 0) {
    return (
      <>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => setDrawerOpen(true)}
        >
          <HugeiconsIcon
            icon={AiBeautifyIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Buy credits
        </Button>
        <BuyCreditsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </>
    );
  }

  // Enhancing → Spinner + "Enhancing..."
  if (isEnhancing) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
        className="rounded-full bg-background/80 backdrop-blur-sm"
      >
        <Spinner className="size-4" data-icon="inline-start" />
        Enhancing...
      </Button>
    );
  }

  // Default → Magic wand + "AI Enhance (X left)"
  return (
    <Button
      size="sm"
      variant="secondary"
      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
      onClick={onEnhance}
    >
      <HugeiconsIcon
        icon={AiBeautifyIcon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      AI Enhance ({credits} left)
    </Button>
  );
});
