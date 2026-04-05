import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { DeleteShowDialog } from "#/components/DeleteShowDialog";
import { useCascadeDeleteShow } from "#/hooks/useShows";
import { makeTvShow } from "#/test/factories";
import { renderWithProviders } from "#/test/test-utils";

vi.mock("#/hooks/useShows", () => ({
  useCascadeDeleteShow: vi.fn(),
}));

describe("DeleteShowDialog", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useCascadeDeleteShow).mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never);
  });

  it("keeps delete disabled until the typed confirmation matches the show title", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso" });

    renderWithProviders(<DeleteShowDialog open onOpenChange={vi.fn()} show={show} />);

    const input = screen.getByLabelText(/Type/i);
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(deleteButton).toBeDisabled();

    await user.type(input, "delete this_show");
    expect(deleteButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, "delete Ted Lasso");
    expect(deleteButton).toBeEnabled();
  }, 15000);

  it("closes on cancel without firing the mutation", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const show = makeTvShow({ title: "Ted Lasso" });

    renderWithProviders(<DeleteShowDialog open onOpenChange={onOpenChange} show={show} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mutateAsync).not.toHaveBeenCalled();
  }, 10000);

  it("runs the cascade and surfaces success details", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso" });
    const onDeletingChange = vi.fn();
    const onDeleted = vi.fn();
    const onOpenChange = vi.fn();

    mutateAsync.mockResolvedValueOnce({
      deletedEpisodes: 10,
      deletedSeasons: 2,
      updatedWatchlists: 3,
    });

    renderWithProviders(
      <DeleteShowDialog
        open
        onDeletingChange={onDeletingChange}
        onDeleted={onDeleted}
        onOpenChange={onOpenChange}
        show={show}
      />,
    );

    await user.type(screen.getByLabelText(/Type/i), "delete Ted Lasso");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDeletingChange).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        show,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      '"Ted Lasso" was deleted with cascade cleanup: 3 watchlists, 2 seasons, 10 episodes.',
    );
    expect(onDeleted).toHaveBeenCalledTimes(1);
  }, 10000);
});
