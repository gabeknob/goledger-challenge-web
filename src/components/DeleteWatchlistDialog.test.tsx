import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { DeleteWatchlistDialog } from "#/components/DeleteWatchlistDialog";
import { useDeleteWatchlist } from "#/hooks/useWatchlists";
import { makeWatchlist } from "#/test/factories";
import { renderWithProviders } from "#/test/test-utils";

vi.mock("#/hooks/useWatchlists", () => ({
  useDeleteWatchlist: vi.fn(),
}));

describe("DeleteWatchlistDialog", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useDeleteWatchlist).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never);
  });

  it("deletes the selected watchlist and closes the dialog", async () => {
    const user = userEvent.setup();
    const watchlist = makeWatchlist({ title: "Weekend Picks" });
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();

    renderWithProviders(
      <DeleteWatchlistDialog
        onDeleted={onDeleted}
        onOpenChange={onOpenChange}
        open
        watchlist={watchlist}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Watchlist" }));

    expect(mutateAsync).toHaveBeenCalledWith(watchlist);
    expect(toast.success).toHaveBeenCalledWith('"Weekend Picks" was removed successfully.');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
