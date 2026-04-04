import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/shows/$showId")({
  loader: ({ params }) => ({
    crumb: decodeURIComponent(params.showId),
  }),
  component: ShowRouteLayout,
});

function ShowRouteLayout() {
  return <Outlet />;
}
