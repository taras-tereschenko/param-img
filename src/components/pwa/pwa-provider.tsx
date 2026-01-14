import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptContextValue {
  canInstall: boolean;
  shouldShow: boolean;
  promptInstall: () => void;
  dismissPrompt: () => void;
  triggerShow: () => void;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Capture the beforeinstallprompt event globally before React hydrates
// This event fires very early, often before our component mounts
let capturedPromptEvent: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  console.log("[PWA] Setting up beforeinstallprompt listener");
  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("[PWA] beforeinstallprompt event fired!", e);
    e.preventDefault();
    capturedPromptEvent = e as BeforeInstallPromptEvent;
  });
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(
  null,
);

export function PWAProvider({ children }: { children: ReactNode }) {
  // Initialize with any event that was captured before mount
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => capturedPromptEvent);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    return Date.now() < parseInt(dismissed, 10);
  });

  useEffect(() => {
    console.log("[PWA] Provider mounted, capturedPromptEvent:", !!capturedPromptEvent);
    // Check again in case event fired between initial render and effect
    if (capturedPromptEvent && !deferredPrompt) {
      setDeferredPrompt(capturedPromptEvent);
    }

    // Continue listening for future events
    const handler = (e: Event) => {
      console.log("[PWA] beforeinstallprompt in useEffect handler");
      e.preventDefault();
      capturedPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [deferredPrompt]);

  // Debug logging
  useEffect(() => {
    console.log("[PWA] State:", {
      canInstall: !!deferredPrompt,
      hasTriggered,
      isDismissed,
      shouldShow: hasTriggered && !isDismissed,
    });
  }, [deferredPrompt, hasTriggered, isDismissed]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION));
    setIsDismissed(true);
  }, []);

  const triggerShow = useCallback(() => {
    console.log("[PWA] triggerShow called");
    setHasTriggered(true);
  }, []);

  return (
    <InstallPromptContext.Provider
      value={{
        canInstall: !!deferredPrompt,
        shouldShow: hasTriggered && !isDismissed,
        promptInstall,
        dismissPrompt,
        triggerShow,
      }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt() {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error("useInstallPrompt must be used within PWAProvider");
  }
  return context;
}
