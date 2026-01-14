import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border bg-card p-4 shadow-lg md:left-auto md:right-4 md:w-80">
      <p className="mb-3 text-sm font-medium">New version available!</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Reload
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}
