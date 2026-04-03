import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "#/lib/auth";
import { Navbar } from "#/components/Navbar";
import { BottomTabBar } from "#/components/BottomTabBar";
import { Breadcrumbs } from "#/components/Breadcrumbs";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col pb-16 md:pb-0">
      <Navbar />
      <Breadcrumbs />
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
