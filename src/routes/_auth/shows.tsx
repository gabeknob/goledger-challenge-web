import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/shows")({
  staticData: { crumb: "Shows" },
  component: ShowsLayout,
});

function ShowsLayout() {
  return <Outlet />;
}
