import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WatchlistsPage } from "#/routes/_auth/watchlists/index";
import { makeTvShow, makeWatchlist } from "#/test/factories";
import { renderRoute } from "#/test/test-utils";

const useShowsMock = vi.fn();
const useWatchlistsMock = vi.fn();

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

vi.mock("#/hooks/useWatchlists", () => ({
  useWatchlists: () => useWatchlistsMock(),
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
  WatchlistCardSkeleton: () => <div data-testid="watchlist-card-skeleton">Loading</div>,
}));

vi.mock("#/components/WatchlistFormDialog", () => ({
  WatchlistFormDialog: () => null,
}));

vi.mock("#/components/DeleteWatchlistDialog", () => ({
  DeleteWatchlistDialog: () => null,
}));

describe("/watchlists page", () => {
  beforeEach(() => {
    useShowsMock.mockReturnValue({ data: [] });
    useWatchlistsMock.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
  });

  it("shows the empty state when there are no watchlists", async () => {
    await renderRoute({
      component: WatchlistsPage,
      path: "/watchlists",
    });

    expect(screen.getByText("No watchlists yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create watchlist" })).toBeInTheDocument();
  }, 10000);

  it("shows the no-results state when search has no matches", async () => {
    const user = userEvent.setup();

    useShowsMock.mockReturnValue({ data: [makeTvShow()] });
    useWatchlistsMock.mockReturnValue({
      data: [makeWatchlist({ title: "Favorites" })],
      isError: false,
      isLoading: false,
    });

    await renderRoute({
      component: WatchlistsPage,
      path: "/watchlists",
    });

    await user.type(screen.getByPlaceholderText("Search watchlists..."), "anime");

    expect(screen.getByText('No watchlists matching "anime"')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });
});
