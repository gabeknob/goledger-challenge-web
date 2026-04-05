import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { WatchlistMembershipPopover } from "#/components/WatchlistMembershipPopover";
import { useUpdateWatchlist, useWatchlists } from "#/hooks/useWatchlists";
import { makeTvShow, makeWatchlist } from "#/test/factories";
import { renderWithProviders } from "#/test/test-utils";

vi.mock("#/hooks/useWatchlists", () => ({
  useUpdateWatchlist: vi.fn(),
  useWatchlists: vi.fn(),
}));

vi.mock("#/components/WatchlistFormDialog", () => ({
  WatchlistFormDialog: ({ open }: { open: boolean }) =>
    open ? <div>Create watchlist dialog</div> : null,
}));

describe("WatchlistMembershipPopover", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useUpdateWatchlist).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never);
  });

  it("toggles membership for the selected show", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted" });
    const watchlist = makeWatchlist({ title: "Favorites", tvShows: [] });

    vi.mocked(useWatchlists).mockReturnValue({
      data: [watchlist],
    } as never);

    renderWithProviders(<WatchlistMembershipPopover show={show} />);

    await user.click(screen.getByRole("button", { name: "+ Watchlist" }));
    await user.click(screen.getByText("Favorites"));

    expect(mutateAsync).toHaveBeenCalledWith({
      current: watchlist,
      next: {
        description: watchlist.description ?? "",
        title: watchlist.title,
        tvShows: [{ "@assetType": "tvShows", "@key": show["@key"] }],
      },
    });
    expect(toast.success).toHaveBeenCalledWith('Added "Ted Lasso" to "Favorites".');
  }, 15000);

  it("opens the create-watchlist shortcut from inside the popover", async () => {
    const user = userEvent.setup();

    vi.mocked(useWatchlists).mockReturnValue({
      data: [],
    } as never);

    renderWithProviders(<WatchlistMembershipPopover show={makeTvShow()} />);

    await user.click(screen.getByRole("button", { name: "+ Watchlist" }));
    await user.click(screen.getByRole("button", { name: "New watchlist" }));

    expect(screen.getByText("Create watchlist dialog")).toBeInTheDocument();
  }, 10000);
});
