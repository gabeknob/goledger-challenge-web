import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { WatchlistAddShowsDialog } from "#/components/WatchlistAddShowsDialog";
import { useUpdateWatchlist } from "#/hooks/useWatchlists";
import { makeTvShow, makeWatchlist } from "#/test/factories";
import { renderWithProviders } from "#/test/test-utils";

vi.mock("#/hooks/useWatchlists", () => ({
  useUpdateWatchlist: vi.fn(),
}));

vi.mock("#/hooks/useTMDB", () => ({
  useTMDB: () => ({ imageUrl: null }),
}));

describe("WatchlistAddShowsDialog", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useUpdateWatchlist).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never);
  });

  it("filters out existing shows and bulk adds the selected ones in a single mutation", async () => {
    const user = userEvent.setup();
    const ted = makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted" });
    const lost = makeTvShow({ title: "Lost", "@key": "tvShows:lost" });
    const severance = makeTvShow({ title: "Severance", "@key": "tvShows:severance" });
    const watchlist = makeWatchlist({
      title: "Weekend Picks",
      tvShows: [{ "@assetType": "tvShows", "@key": ted["@key"] }],
    });
    const onOpenChange = vi.fn();

    renderWithProviders(
      <WatchlistAddShowsDialog
        onOpenChange={onOpenChange}
        open
        shows={[ted, lost, severance]}
        watchlist={watchlist}
      />,
    );

    expect(screen.queryByText("Ted Lasso")).not.toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
    expect(screen.getByText("Severance")).toBeInTheDocument();

    await user.click(screen.getByText("Lost"));
    await user.click(screen.getByText("Severance"));
    await user.click(screen.getByRole("button", { name: "Add 2 shows" }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      current: watchlist,
      next: {
        description: watchlist.description ?? "",
        title: watchlist.title,
        tvShows: [
          { "@assetType": "tvShows", "@key": ted["@key"] },
          { "@assetType": "tvShows", "@key": lost["@key"] },
          { "@assetType": "tvShows", "@key": severance["@key"] },
        ],
      },
    });
    expect(toast.success).toHaveBeenCalledWith('Added 2 shows to "Weekend Picks".');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  }, 10000);
});
