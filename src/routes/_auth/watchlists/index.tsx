import { createFileRoute } from "@tanstack/react-router";

import { WatchlistsPage } from "#/pages/_auth/watchlists/WatchlistsPage";

export const Route = createFileRoute("/_auth/watchlists/")({
  component: WatchlistsPage,
});
