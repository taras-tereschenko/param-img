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

const InstallPromptContext = createContext<InstallPromptContextValue | null>(
  null,
);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    return Date.now() < parseInt(dismissed, 10);
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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
