import { Link } from "@tanstack/react-router";
import { useAuth } from "#/hooks/useAuth";
import { Button } from "#/components/ui/button";

export function Navbar() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
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

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto hidden md:inline-flex"
          onClick={logout}
        >
          Log out
        </Button>
      </nav>
    </header>
  );
}
