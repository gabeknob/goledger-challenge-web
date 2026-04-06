import { useEffect } from "react";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "#/lib/queryClient";
import { useThemeStore } from "#/stores/theme";
import { Button } from "#/components/ui/button";

import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h1 className="display-title mt-4 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or was moved.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error }: ErrorComponentProps) => (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">!</p>
      <h1 className="display-title mt-4 text-2xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  ),
});

function RootComponent() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute -top-108 -right-108 size-360 animate-[pulse_30s_ease-in-out_infinite,spin_45s_ease-in-out_infinite] rounded-[35%] bg-radial from-primary/10 to-transparent blur-3xl dark:from-accent-foreground/15 dark:saturate-50" />
        <div className="absolute -bottom-200 -left-108 size-360 animate-[spin_90s_ease-in-out_infinite,pulse_22s_ease-in-out_infinite] rounded-[40%] bg-radial from-amber-600/15 to-transparent blur-3xl dark:from-chart-3/20" />
        <div className="absolute -right-144 -bottom-260 size-360 animate-[spin_18s_ease-in-out_infinite,pulse_170s_ease-in-out_infinite] rounded-[35%] bg-radial from-blue-400/10 to-transparent blur-3xl dark:from-amber-600/5" />
      </div>
      <Outlet />
      <Toaster richColors position="top-right" />
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </QueryClientProvider>
  );
}
