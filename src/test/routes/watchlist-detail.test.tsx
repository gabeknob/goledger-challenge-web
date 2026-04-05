import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { makeTvShow, makeWatchlist } from "#/test/factories";
import { renderAppRoute } from "#/test/test-utils";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const useShowsMock = vi.fn();
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

vi.mock("#/hooks/useWatchlists", () => ({
  useUpdateWatchlist: () => ({
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

vi.mock("#/components/WatchlistShowCard", () => ({
  WatchlistShowCard: ({
    onRemove,
    show,
  }: {
    onRemove: (show: { title: string }) => void;
    show: { title: string };
  }) => (
    <div>
      <div>{show.title}</div>
      <button type="button" onClick={() => onRemove(show)}>
        Remove {show.title}
      </button>
    </div>
  ),
}));

vi.mock("#/components/WatchlistAddShowsDialog", () => ({
  WatchlistAddShowsDialog: ({ open }: { open: boolean }) =>
    open ? <div>Add shows dialog</div> : null,
}));

vi.mock("#/components/WatchlistFormDialog", () => ({
  WatchlistFormDialog: ({
    onSubmitted,
    open,
    watchlist,
  }: {
    onSubmitted?: (title: string) => void;
    open: boolean;
    watchlist?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>{`Edit ${watchlist?.title}`}</div>
        <button type="button" onClick={() => onSubmitted?.("Renamed Watchlist")}>
          Submit watchlist form
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/DeleteWatchlistDialog", () => ({
  DeleteWatchlistDialog: ({
    onDeleted,
    open,
    watchlist,
  }: {
    onDeleted?: () => void;
    open: boolean;
    watchlist?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>{`Delete ${watchlist?.title}`}</div>
        <button type="button" onClick={() => onDeleted?.()}>
          Confirm delete
        </button>
      </div>
    ) : null,
}));

describe("watchlist detail route", () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    updateWatchlistMutateAsyncMock.mockReset();
    useShowsMock.mockReturnValue({ data: [] });
    useWatchlistsMock.mockReturnValue({ data: [] });
    useWatchlistMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    });
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

    expect(screen.getByText("Add shows dialog")).toBeInTheDocument();
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
    useWatchlistsMock.mockReturnValue({ data: [originalWatchlist, renamedWatchlist] });
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
    expect(screen.getByText("Edit Weekend Picks")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit watchlist form" }));
    expect(await screen.findByRole("heading", { name: "Renamed Watchlist" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Ted Lasso" }));

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
    expect(screen.getByText("Delete Renamed Watchlist")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(await screen.findByRole("heading", { name: "Watchlists" })).toBeInTheDocument();
  }, 15000);
});
