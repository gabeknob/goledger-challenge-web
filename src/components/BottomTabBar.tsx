import { Link } from '@tanstack/react-router'
import { Home, Tv, Bookmark } from 'lucide-react'

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-4 py-1">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-xs text-muted-foreground transition-colors [&.active]:text-foreground"
        >
          <Home size={20} />
          Home
        </Link>
        <Link
          to="/shows"
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-xs text-muted-foreground transition-colors [&.active]:text-foreground"
        >
          <Tv size={20} />
          Shows
        </Link>
        <Link
          to="/watchlists"
          className="flex flex-col items-center gap-0.5 px-5 py-2 text-xs text-muted-foreground transition-colors [&.active]:text-foreground"
        >
          <Bookmark size={20} />
          Watchlists
        </Link>
      </div>
    </nav>
  )
}
