import { createFileRoute } from "@tanstack/react-router";

import { ShowDetailPage } from "#/pages/_auth/shows/ShowDetailPage";

export const Route = createFileRoute("/_auth/shows/$showId/")({
  validateSearch: search => ({
    season:
      typeof search.season === "number"
        ? search.season
        : typeof search.season === "string" && search.season.trim()
          ? Number(search.season)
          : undefined,
  }),
  component: ShowDetailPage,
});
