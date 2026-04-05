import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { makeTvShow, makeWatchlist } from "#/test/factories";
import { renderAppRoute } from "#/test/test-utils";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const createWatchlistMutateAsyncMock = vi.fn();
const deleteWatchlistMutateAsyncMock = vi.fn();
const useShowsMock = vi.fn();
const useTMDBMock = vi.fn();
const useWatchlistsMock = vi.fn();
const useWatchlistMock = vi.fn();
const updateWatchlistMutateAsyncMock = vi.fn();

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

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

vi.mock("#/hooks/useWatchlists", () => ({
  useCreateWatchlist: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => createWatchlistMutateAsyncMock(...args),
  }),
  useDeleteWatchlist: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => deleteWatchlistMutateAsyncMock(...args),
  }),
  useUpdateWatchlist: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => updateWatchlistMutateAsyncMock(...args),
  }),
  useWatchlist: (title: string) => useWatchlistMock(title),
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

describe("watchlist detail route", () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    createWatchlistMutateAsyncMock.mockReset();
    deleteWatchlistMutateAsyncMock.mockReset();
    updateWatchlistMutateAsyncMock.mockReset();
    useShowsMock.mockReturnValue({ data: [] });
    useTMDBMock.mockReturnValue({ imageUrl: null });
    useWatchlistsMock.mockReturnValue({ data: [] });
    useWatchlistMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    });
    createWatchlistMutateAsyncMock.mockResolvedValue(undefined);
    deleteWatchlistMutateAsyncMock.mockResolvedValue(undefined);
  });

  it("renders the not-found state when the watchlist query fails", async () => {
    useWatchlistMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    });

    await renderAppRoute("/watchlists/Missing");

    expect(await screen.findByRole("heading", { name: "Watchlist not found" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to watchlists" })).toBeInTheDocument();
  }, 15000);

  it("renders the empty watchlist state and opens the add-show dialog", async () => {
    const user = userEvent.setup();
    const watchlist = makeWatchlist({
      title: "Weekend Picks",
      description: "",
      tvShows: [],
    });

    useWatchlistsMock.mockReturnValue({ data: [watchlist] });
    useWatchlistMock.mockReturnValue({
      data: watchlist,
      isError: false,
      isLoading: false,
    });

    await renderAppRoute("/watchlists/Weekend%20Picks");

    expect(await screen.findByRole("heading", { name: "Weekend Picks" })).toBeInTheDocument();
    expect(screen.getByText("0 shows in this watchlist")).toBeInTheDocument();
    expect(screen.getByText("No description for this watchlist yet.")).toBeInTheDocument();
    expect(screen.getByText("No shows yet")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Add Show" })[0]);

    expect(screen.getByRole("heading", { name: "Add Shows" })).toBeInTheDocument();
  }, 15000);

  it("renames the watchlist, removes shows, and navigates after delete", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted-lasso" });
    const originalWatchlist = makeWatchlist({
      title: "Weekend Picks",
      tvShows: [{ "@assetType": "tvShows", "@key": show["@key"] }],
    });
    const renamedWatchlist = makeWatchlist({
      title: "Renamed Watchlist",
      tvShows: originalWatchlist.tvShows,
    });

    useShowsMock.mockReturnValue({ data: [show] });
    useWatchlistsMock.mockReturnValue({ data: [originalWatchlist] });
    useWatchlistMock.mockImplementation((title: string) => {
      if (title === "Renamed Watchlist") {
        return {
          data: renamedWatchlist,
          isError: false,
          isLoading: false,
        };
      }

      return {
        data: originalWatchlist,
        isError: false,
        isLoading: false,
      };
    });
    updateWatchlistMutateAsyncMock.mockResolvedValue(undefined);

    await renderAppRoute("/watchlists/Weekend%20Picks");

    expect(await screen.findByRole("heading", { name: "Weekend Picks" })).toBeInTheDocument();
    expect(screen.getByText("1 show in this watchlist")).toBeInTheDocument();
    expect(screen.getByText("Ted Lasso")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Watchlist" }));
    expect(screen.getByRole("heading", { name: "Edit Watchlist" })).toBeInTheDocument();
    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Renamed Watchlist");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByRole("heading", { name: "Renamed Watchlist" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Show actions" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Remove from watchlist" })[1]!);

    await waitFor(() => {
      expect(updateWatchlistMutateAsyncMock).toHaveBeenCalledWith({
        current: renamedWatchlist,
        next: {
          title: renamedWatchlist.title,
          description: renamedWatchlist.description ?? "",
          tvShows: [],
        },
      });
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Removed "Ted Lasso" from "Renamed Watchlist".',
    );

    await user.click(screen.getByRole("button", { name: "Delete Watchlist" }));
    expect(screen.getByText("Delete watchlist?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Watchlist" }));
    expect(await screen.findByRole("heading", { name: "Watchlists" })).toBeInTheDocument();
  }, 15000);
});
