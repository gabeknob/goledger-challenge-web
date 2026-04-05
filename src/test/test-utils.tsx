import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RouteComponent,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render } from "@testing-library/react";

function normalizeRoutePath(path: string) {
  if (path === "/") {
    return "/";
  }

  return path.replace(/^\//, "");
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(ui: ReactElement, queryClient = createTestQueryClient()) {
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

type TestRouteComponent = RouteComponent;

interface RouteDefinition {
  component?: TestRouteComponent;
  path: string;
}

interface RenderRouteOptions {
  additionalRoutes?: RouteDefinition[];
  component: TestRouteComponent;
  initialEntry?: string;
  path: string;
}

export async function renderRoute({
  additionalRoutes = [],
  component: Component,
  initialEntry,
  path,
}: RenderRouteOptions) {
  const queryClient = createTestQueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });

  const routes = [
    createRoute({
      component: Component,
      getParentRoute: () => rootRoute,
      path: normalizeRoutePath(path),
    }),
    ...additionalRoutes.map(route =>
      createRoute({
        component: route.component ?? (() => null),
        getParentRoute: () => rootRoute,
        path: normalizeRoutePath(route.path),
      }),
    ),
  ];

  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({
      initialEntries: [initialEntry ?? path],
    }),
  });

  let rendered: ReturnType<typeof render> | undefined;

  await act(async () => {
    await router.load();
    rendered = render(<RouterProvider router={router} />);
  });

  return {
    queryClient,
    router,
    ...rendered!,
  };
}

export async function renderAppRoute(initialEntry: string) {
  const { routeTree } = await import("#/routeTree.gen");

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialEntry],
    }),
    scrollRestoration: true,
  });

  let rendered: ReturnType<typeof render> | undefined;

  await act(async () => {
    await router.load();
    rendered = render(<RouterProvider router={router} />);
  });

  return {
    router,
    ...rendered!,
  };
}
