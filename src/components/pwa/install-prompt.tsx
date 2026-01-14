import { useInstallPrompt } from "./pwa-provider";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const { canInstall, promptInstall, dismissPrompt, shouldShow } =
    useInstallPrompt();

  if (!canInstall || !shouldShow) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border bg-card p-4 shadow-lg md:left-auto md:right-4 md:w-80">
      <p className="mb-1 text-sm font-medium">Install Param Img</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Add to your home screen for quick access
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={promptInstall}>
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={dismissPrompt}>
          Not now
        </Button>
      </div>
    </div>
  );
}
