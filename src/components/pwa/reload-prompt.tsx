import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (needRefresh && !toastIdRef.current) {
      toastIdRef.current = toast("Update available", {
        description: "A new version is ready to install",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => updateServiceWorker(true),
        },
        cancel: {
          label: "Later",
          onClick: () => setNeedRefresh(false),
        },
        onDismiss: () => setNeedRefresh(false),
      });
    }

    if (!needRefresh && toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}
