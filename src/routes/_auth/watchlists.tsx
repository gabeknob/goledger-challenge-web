import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/watchlists")({
  staticData: { crumb: "Watchlists" },
  component: WatchlistsLayout,
});

function WatchlistsLayout() {
  return <Outlet />;
}
