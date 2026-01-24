import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

export function ReloadPrompt() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates periodically (every hour)
      // Uses robust implementation from vite-plugin-pwa docs:
      // https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html
      if (registration) {
        // Clear any existing interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(
          async () => {
            try {
              // Skip if SW is currently installing
              if (registration.installing) return;

              // Skip if browser is offline
              if ("connection" in navigator && !navigator.onLine) return;

              // Verify server is reachable before attempting update
              const resp = await fetch(swUrl, {
                cache: "no-store",
                headers: { "cache-control": "no-cache" },
              });

              if (resp.status === 200) {
                await registration.update();
              }
            } catch (error: unknown) {
              // Network error during update check - this is expected when offline
              console.warn("SW update check failed:", error);
            }
          },
          60 * 60 * 1000,
        );
      }
    },
  });

  const toastIdRef = useRef<string | number | null>(null);

  const handleUpdate = () => {
    // updateServiceWorker(true) triggers skipWaiting and reloads all tabs automatically
    updateServiceWorker(true);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (needRefresh && !toastIdRef.current) {
      toastIdRef.current = toast("Update available", {
        description: "A new version is ready to install",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: handleUpdate,
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
  }, [needRefresh, setNeedRefresh]);

  return null;
}
