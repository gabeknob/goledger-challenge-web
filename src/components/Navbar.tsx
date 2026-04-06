import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";

import { useAuth } from "#/hooks/useAuth";
import { useThemeStore } from "#/stores/theme";
import { Button } from "#/components/ui/button";

export function Navbar() {
  const { logout } = useAuth();
  const { theme, toggle } = useThemeStore();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link to="/" className="display-title text-lg font-bold text-foreground no-underline">
          GoLedger TV
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/shows"
            className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
          >
            Shows
          </Link>
          <Link
            to="/watchlists"
            className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
          >
            Watchlists
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <HugeiconsIcon icon={theme === "dark" ? Sun01Icon : Moon02Icon} className="size-4.5" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={logout}>
            Log out
          </Button>
        </div>
      </nav>
    </header>
  );
}
