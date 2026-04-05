import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "#/pages/_auth/HomePage";

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
});
