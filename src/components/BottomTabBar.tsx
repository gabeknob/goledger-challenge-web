import { Link } from "@tanstack/react-router";
import { Bookmark01Icon, Home01Icon, Tv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function BottomTabBar() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-background/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-4 py-1">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-xs text-muted-foreground transition-colors [&.active]:text-foreground"
        >
          <HugeiconsIcon icon={Home01Icon} size={20} />
          Home
        </Link>
        <Link
          to="/shows"
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-xs text-muted-foreground transition-colors [&.active]:text-foreground"
        >
          <HugeiconsIcon icon={Tv01Icon} size={20} />
          Shows
        </Link>
        <Link
          to="/watchlists"
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-xs text-muted-foreground transition-colors [&.active]:text-foreground"
        >
          <HugeiconsIcon icon={Bookmark01Icon} size={20} />
          Watchlists
        </Link>
      </div>
    </nav>
  );
}
