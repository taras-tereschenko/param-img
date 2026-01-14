import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useInstallPrompt } from "./pwa-provider";

export function InstallPrompt() {
  const { canInstall, promptInstall, dismissPrompt, shouldShow } =
    useInstallPrompt();
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (canInstall && shouldShow && !toastIdRef.current) {
      toastIdRef.current = toast("Install Param Img", {
        description: "Add to your home screen for quick access",
        duration: Infinity,
        action: {
          label: "Install",
          onClick: promptInstall,
        },
        cancel: {
          label: "Not now",
          onClick: dismissPrompt,
        },
        onDismiss: dismissPrompt,
      });
    }

    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [canInstall, shouldShow, promptInstall, dismissPrompt]);

  return null;
}
