import { createFileRoute } from "@tanstack/react-router";

import { ShowsPage } from "#/pages/_auth/shows/ShowsPage";

export const Route = createFileRoute("/_auth/shows/")({
  component: ShowsPage,
});
