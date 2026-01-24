import {
  HeadContent,
  Navigate,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import appCss from "../styles.css?url";
import type { User } from "@/lib/auth";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { ReloadPrompt } from "@/components/pwa/reload-prompt";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/server/get-session";

// Validate environment at startup (server-side only)
if (typeof window === "undefined") {
  import("@/lib/env").then(({ validateEnv }) => validateEnv());
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

export interface RootRouteContext {
  user: User | null;
  isAuthenticated: boolean;
}

export const Route = createRootRoute({
  beforeLoad: async (): Promise<RootRouteContext> => {
    const session = await getSession();
    return {
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
    };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Param Img",
      },
      {
        name: "theme-color",
        content: "#0a0a0a",
      },
      {
        name: "description",
        content: "Resize images for Instagram Stories",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo192.png",
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
    ],
  }),
  notFoundComponent: () => <Navigate to="/" />,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <PWAProvider>
            {children}
            <ReloadPrompt />
            <InstallPrompt />
            <Toaster />
          </PWAProvider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
