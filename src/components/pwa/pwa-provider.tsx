import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

// BeforeInstallPrompt API type declaration (not yet in standard TypeScript lib)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
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
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    capturedPromptEvent = e;
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
    // Check again in case event fired between initial render and effect
    if (capturedPromptEvent && !deferredPrompt) {
      setDeferredPrompt(capturedPromptEvent);
    }

    // Continue listening for future events
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      capturedPromptEvent = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [deferredPrompt]);

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
