import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ShowFormDialog } from "#/components/ShowFormDialog";
import { useCreateShow, useUpdateShow } from "#/hooks/useShows";
import { makeTvShow } from "#/test/factories";
import { renderWithProviders } from "#/test/test-utils";

vi.mock("#/hooks/useShows", () => ({
  useCreateShow: vi.fn(),
  useUpdateShow: vi.fn(),
}));

describe("ShowFormDialog", () => {
  const createMutateAsync = vi.fn();
  const updateMutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useCreateShow).mockReturnValue({
      isPending: false,
      mutateAsync: createMutateAsync,
    } as never);
    vi.mocked(useUpdateShow).mockReturnValue({
      isPending: false,
      mutateAsync: updateMutateAsync,
    } as never);
  });

  it("creates a new show and closes on success", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <ShowFormDialog existingShows={[]} mode="create" open onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("Title"), "Ted Lasso");
    await user.type(screen.getByLabelText("Description"), "A charming comedy.");
    await user.clear(screen.getByLabelText("Recommended age"));
    await user.type(screen.getByLabelText("Recommended age"), "14");
    await user.click(screen.getByRole("button", { name: "Create Show" }));

    expect(createMutateAsync).toHaveBeenCalledWith({
      description: "A charming comedy.",
      recommendedAge: 14,
      title: "Ted Lasso",
    });
    expect(toast.success).toHaveBeenCalledWith('"Ted Lasso" was created successfully.');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  }, 10000);

  it("locks the title in edit mode and updates the current show", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso", description: "Old description" });

    renderWithProviders(
      <ShowFormDialog existingShows={[show]} mode="edit" open onOpenChange={vi.fn()} show={show} />,
    );

    expect(screen.getByLabelText("Title")).toHaveAttribute("readonly");

    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Updated description");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateMutateAsync).toHaveBeenCalledWith({
      current: show,
      next: {
        description: "Updated description",
        recommendedAge: 14,
        title: "Ted Lasso",
      },
    });
  });

  it("shows schema validation errors before submitting", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ShowFormDialog
        existingShows={[makeTvShow({ title: "Ted Lasso" })]}
        mode="create"
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Title"), "Ted Lasso");
    await user.click(screen.getByRole("button", { name: "Create Show" }));

    expect(await screen.findByText("A TV show with this title already exists")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();
  }, 10000);

  it("shows inline errors on an empty submit", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ShowFormDialog existingShows={[]} mode="create" open onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Create Show" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Recommended age")).toHaveValue(16);
    expect(createMutateAsync).not.toHaveBeenCalled();
  }, 10000);
});
