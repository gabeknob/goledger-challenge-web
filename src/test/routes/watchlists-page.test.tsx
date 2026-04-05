import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

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

vi.mock("#/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange: (value: string) => void;
    value: string;
  }) => (
    <div>
      <div>{value}</div>
      <button type="button" onClick={() => onValueChange("az")}>
        Sort A-Z
      </button>
      <button type="button" onClick={() => onValueChange("za")}>
        Sort Z-A
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>Sort</span>,
}));

vi.mock("#/components/WatchlistCard", () => ({
  WatchlistCard: ({
    itemTitles,
    onDelete,
    onEdit,
    watchlist,
  }: {
    itemTitles: string[];
    onDelete: (watchlist: { title: string }) => void;
    onEdit: (watchlist: { title: string }) => void;
    watchlist: { title: string };
  }) => (
    <div>
      <div>{watchlist.title}</div>
      {itemTitles.map((title, index) => (
        <div key={`${title}-${index}`}>{title}</div>
      ))}
      <button type="button" onClick={() => onEdit(watchlist)}>
        Edit {watchlist.title}
      </button>
      <button type="button" onClick={() => onDelete(watchlist)}>
        Delete {watchlist.title}
      </button>
    </div>
  ),
  WatchlistCardSkeleton: () => <div data-testid="watchlist-card-skeleton">Loading</div>,
}));

vi.mock("#/components/WatchlistFormDialog", () => ({
  WatchlistFormDialog: ({
    mode,
    onOpenChange,
    open,
    watchlist,
  }: {
    mode: "create" | "edit";
    onOpenChange: (open: boolean) => void;
    open: boolean;
    watchlist?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>{mode === "create" ? "Create watchlist dialog" : `Edit ${watchlist?.title}`}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close watchlist form
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/DeleteWatchlistDialog", () => ({
  DeleteWatchlistDialog: ({
    onOpenChange,
    open,
    watchlist,
  }: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    watchlist?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>{`Delete ${watchlist?.title}`}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close delete watchlist
        </button>
      </div>
    ) : null,
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
    const user = userEvent.setup();

    await renderRoute({
      component: WatchlistsPage,
      path: "/watchlists",
    });

    expect(screen.getByText("No watchlists yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create watchlist" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create watchlist" }));
    expect(screen.getByText("Create watchlist dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close watchlist form" }));
    expect(screen.queryByRole("button", { name: "Close watchlist form" })).not.toBeInTheDocument();
  }, 10000);

  it("shows loading and error states", async () => {
    useWatchlistsMock.mockReturnValueOnce({
      data: undefined,
      isError: false,
      isLoading: true,
    });

    const loadingRender = await renderRoute({
      component: WatchlistsPage,
      path: "/watchlists",
    });

    expect(loadingRender.getAllByTestId("watchlist-card-skeleton")).toHaveLength(8);

    useWatchlistsMock.mockReturnValueOnce({
      data: undefined,
      isError: true,
      isLoading: false,
    });

    await renderRoute({
      component: WatchlistsPage,
      path: "/watchlists",
    });

    expect(screen.getByText("Failed to load watchlists. Please try again.")).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.queryByText('No watchlists matching "anime"')).not.toBeInTheDocument();
  });

  it("renders populated watchlists, supports sorting, and opens and closes dialogs", async () => {
    const user = userEvent.setup();

    useShowsMock.mockReturnValue({
      data: [
        makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted-lasso" }),
        makeTvShow({ title: "Severance", "@key": "tvShows:severance" }),
      ],
    });
    useWatchlistsMock.mockReturnValue({
      data: [
        makeWatchlist({
          title: "Zeta",
          tvShows: [{ "@key": "tvShows:severance", "@assetType": "tvShows" }],
        }),
        makeWatchlist({
          title: "Alpha",
          tvShows: [{ "@key": "tvShows:missing-show", "@assetType": "tvShows" }],
        }),
        makeWatchlist({
          title: "Gamma",
          tvShows: undefined,
        }),
      ],
      isError: false,
      isLoading: false,
    });

    await renderRoute({
      component: WatchlistsPage,
      path: "/watchlists",
    });

    const cards = screen.getAllByText(/Alpha|Zeta|Gamma/).map(node => node.textContent);
    expect(cards).toContain("Alpha");
    expect(cards).toContain("Zeta");
    expect(cards).toContain("Gamma");
    expect(screen.getByText("Severance")).toBeInTheDocument();
    expect(screen.getByText("Unknown show")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Watchlist" }));
    expect(screen.getByText("Create watchlist dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close watchlist form" }));
    expect(screen.queryByText("Create watchlist dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Alpha" }));
    expect(screen.getAllByText("Edit Alpha").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close watchlist form" }));
    expect(screen.queryByRole("button", { name: "Close watchlist form" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sort Z-A" }));
    const titles = screen
      .getAllByText(/Alpha|Zeta|Gamma/)
      .filter(
        node =>
          node.textContent === "Alpha" || node.textContent === "Zeta" || node.textContent === "Gamma",
      )
      .map(node => node.textContent);
    expect(titles.slice(0, 3)).toEqual(["Zeta", "Gamma", "Alpha"]);

    await user.click(screen.getByRole("button", { name: "Sort A-Z" }));
    const ascendingTitles = screen
      .getAllByText(/Alpha|Zeta|Gamma/)
      .filter(
        node =>
          node.textContent === "Alpha" || node.textContent === "Zeta" || node.textContent === "Gamma",
      )
      .map(node => node.textContent);
    expect(ascendingTitles.slice(0, 3)).toEqual(["Alpha", "Gamma", "Zeta"]);

    await user.click(screen.getByRole("button", { name: "Delete Alpha" }));
    expect(screen.getAllByText("Delete Alpha").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close delete watchlist" }));
    expect(screen.queryByRole("button", { name: "Close delete watchlist" })).not.toBeInTheDocument();
  }, 10000);
});
