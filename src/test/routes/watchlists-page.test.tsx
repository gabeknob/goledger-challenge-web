import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { WatchlistsPage } from "#/routes/_auth/watchlists/index";
import { makeTvShow, makeWatchlist } from "#/test/factories";
import { renderRoute } from "#/test/test-utils";

const navigateMock = vi.fn();
const useCreateWatchlistMock = vi.fn();
const useDeleteWatchlistMock = vi.fn();
const useShowsMock = vi.fn();
const useTMDBMock = vi.fn();
const useUpdateWatchlistMock = vi.fn();
const useWatchlistsMock = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

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
  useCreateWatchlist: () => useCreateWatchlistMock(),
  useDeleteWatchlist: () => useDeleteWatchlistMock(),
  useUpdateWatchlist: () => useUpdateWatchlistMock(),
  useWatchlists: () => useWatchlistsMock(),
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

vi.mock("#/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: (event: { preventDefault: () => void }) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.({ preventDefault: () => undefined })}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("#/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("/watchlists page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useCreateWatchlistMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useDeleteWatchlistMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useShowsMock.mockReturnValue({ data: [] });
    useTMDBMock.mockReturnValue({ imageUrl: null });
    useUpdateWatchlistMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
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
    expect(screen.getByRole("heading", { name: "New Watchlist" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "New Watchlist" })).not.toBeInTheDocument();
  }, 20000);

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

    expect(loadingRender.container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

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
    const updateWatchlistMutateAsyncMock = vi.fn().mockResolvedValue(undefined);
    useUpdateWatchlistMock.mockReturnValue({
      isPending: false,
      mutateAsync: updateWatchlistMutateAsyncMock,
    });

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

    const cards = screen
      .getAllByRole("heading", { level: 2 })
      .map(node => node.textContent)
      .filter(Boolean);
    expect(cards).toContain("Alpha");
    expect(cards).toContain("Zeta");
    expect(cards).toContain("Gamma");
    expect(screen.getByText("Severance")).toBeInTheDocument();
    expect(screen.getByText("Unknown show")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Watchlist" }));
    expect(screen.getByRole("heading", { name: "New Watchlist" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "New Watchlist" })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(screen.getByRole("heading", { name: "Edit Watchlist" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Alpha Reloaded");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(updateWatchlistMutateAsyncMock).toHaveBeenCalledWith({
      current: expect.objectContaining({ title: "Alpha" }),
      next: {
        description: expect.any(String),
        title: "Alpha Reloaded",
      },
    });
    expect(navigateMock).toHaveBeenCalledWith({
      params: { title: "Alpha Reloaded" },
      to: "/watchlists/$title",
    });

    await user.click(screen.getByRole("button", { name: "Sort Z-A" }));
    const titles = screen
      .getAllByRole("heading", { level: 2 })
      .map(node => node.textContent)
      .filter((text): text is string => text === "Alpha" || text === "Zeta" || text === "Gamma");
    expect(titles.slice(0, 3)).toEqual(["Zeta", "Gamma", "Alpha"]);

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
    expect(screen.getByText("Delete watchlist?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Sort A-Z" }));
    const ascendingTitles = screen
      .getAllByRole("heading", { level: 2 })
      .map(node => node.textContent)
      .filter((text): text is string => text === "Alpha" || text === "Zeta" || text === "Gamma");
    expect(ascendingTitles.slice(0, 3)).toEqual(["Alpha", "Gamma", "Zeta"]);

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
    expect(screen.getByText("Delete watchlist?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete watchlist?")).not.toBeInTheDocument();
  }, 20000);
});
