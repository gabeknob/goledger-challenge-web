import { screen } from "@testing-library/react";

import { api } from "#/lib/api";
import { HomePage } from "#/routes/_auth/index";
import { renderRoute } from "#/test/test-utils";

const useShowsMock = vi.fn();
const useTMDBMock = vi.fn();

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => true),
  };
});

vi.mock("#/hooks/useShows", () => ({
  useShows: () => useShowsMock(),
}));

vi.mock("#/hooks/useTMDB", () => ({
  useTMDB: (...args: unknown[]) => useTMDBMock(...args),
}));

vi.mock("#/components/Navbar", () => ({
  Navbar: () => null,
}));

vi.mock("#/components/Breadcrumbs", () => ({
  Breadcrumbs: () => null,
}));

vi.mock("#/components/BottomTabBar", () => ({
  BottomTabBar: () => null,
}));

vi.mock("#/components/WatchlistCard", () => ({
  WatchlistCard: ({ watchlist }: { watchlist: { title: string } }) => <div>{watchlist.title}</div>,
}));

vi.mock("#/lib/api", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/api")>();

  return {
    ...actual,
    api: {
      ...actual.api,
      post: vi.fn(),
    },
  };
});

describe("home dashboard", () => {
  beforeEach(() => {
    useShowsMock.mockReturnValue({ data: [] });
    useTMDBMock.mockReturnValue({ imageUrl: null });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        result: [],
      },
    } as never);
  });

  it("shows an empty state for each section independently", async () => {
    await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        {
          path: "/shows",
        },
        {
          path: "/watchlists",
        },
      ],
    });

    expect(
      screen.getByText("Add a few shows to turn this space into a spotlight carousel."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No shows yet. Add your first title to start building the dashboard."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No watchlists yet. Create one to start grouping shows by mood, genre, or occasion.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Create your first show" })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.getByRole("link", { name: "Create a show" })).toHaveAttribute("href", "/shows");
    expect(screen.getByRole("link", { name: "Create a watchlist" })).toHaveAttribute(
      "href",
      "/watchlists",
    );
  }, 15000);
});
