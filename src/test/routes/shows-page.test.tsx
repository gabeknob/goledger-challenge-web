import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShowsPage } from "#/routes/_auth/shows/index";
import { getIntersectionObservers } from "#/test/browser-mocks";
import { makeTvShow } from "#/test/factories";
import { renderRoute } from "#/test/test-utils";

const useShowsBrowseMock = vi.fn();
const useDebouncedStateMock = vi.fn();

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => true),
  };
});

vi.mock("#/hooks/useShows", () => ({
  useShowsBrowse: (...args: unknown[]) => useShowsBrowseMock(...args),
}));

vi.mock("#/hooks/useDebouncedState", () => ({
  useDebouncedState: (...args: unknown[]) => useDebouncedStateMock(...args),
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

vi.mock("#/components/ShowCard", () => ({
  ShowCard: ({
    onDelete,
    onEdit,
    show,
  }: {
    onDelete: (show: { title: string }) => void;
    onEdit: (show: { title: string }) => void;
    show: { title: string };
  }) => (
    <div>
      <div>{show.title}</div>
      <button type="button" onClick={() => onEdit(show)}>
        Edit {show.title}
      </button>
      <button type="button" onClick={() => onDelete(show)}>
        Delete {show.title}
      </button>
    </div>
  ),
  ShowCardSkeleton: () => <div data-testid="show-card-skeleton">Loading</div>,
}));

vi.mock("#/components/ShowFormDialog", () => ({
  ShowFormDialog: ({
    mode,
    onOpenChange,
    open,
    show,
  }: {
    mode: "create" | "edit";
    onOpenChange: (open: boolean) => void;
    open: boolean;
    show?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>{mode === "create" ? "Create show dialog" : `Edit ${show?.title}`}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close show dialog
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/DeleteShowDialog", () => ({
  DeleteShowDialog: ({
    onOpenChange,
    open,
    show,
  }: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    show?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>Delete {show?.title}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close delete show
        </button>
      </div>
    ) : null,
}));

describe("/shows page", () => {
  beforeEach(() => {
    useShowsBrowseMock.mockReturnValue({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });
    useDebouncedStateMock.mockImplementation((value: string) => ({
      debouncedValue: value,
      isDebouncing: false,
    }));
  });

  afterEach(() => {
    useDebouncedStateMock.mockReset();
  });

  it("shows the empty state when there are no shows", async () => {
    const user = userEvent.setup();

    useShowsBrowseMock.mockReturnValueOnce({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });

    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    expect(screen.getByText("No shows yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add your first show" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add your first show" }));
    expect(screen.getByText("Create show dialog")).toBeInTheDocument();
  });

  it("shows the no-results state for an unmatched search", async () => {
    const user = userEvent.setup();

    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    await user.type(screen.getByPlaceholderText("Search shows…"), "bleach");

    expect(await screen.findByText('No shows matching "bleach"')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.queryByText('No shows matching "bleach"')).not.toBeInTheDocument();
  });

  it("keeps current results visible while the search is debouncing", async () => {
    const user = userEvent.setup();

    useShowsBrowseMock.mockReturnValue({
      data: { pages: [{ items: [makeTvShow({ title: "Ted Lasso" })] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });
    useDebouncedStateMock.mockImplementation((value: string) => ({
      debouncedValue: "",
      isDebouncing: value.length > 0,
    }));

    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    expect(screen.getAllByText("Ted Lasso")).not.toHaveLength(0);

    await user.type(screen.getByPlaceholderText("Search shows…"), "ted");

    expect(screen.getAllByText("Ted Lasso")).not.toHaveLength(0);
    expect(screen.getByText("Updating results…")).toBeInTheDocument();
  });

  it("fetches the next page when the sentinel enters the viewport", async () => {
    const fetchNextPage = vi.fn();

    useShowsBrowseMock.mockReturnValue({
      data: {
        pages: [
          {
            items: [makeTvShow({ title: "Ted Lasso" }), makeTvShow({ title: "Shrinking" })],
          },
        ],
      },
      fetchNextPage,
      hasNextPage: true,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });

    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });
    screen.getByText("Ted Lasso");

    const observers = getIntersectionObservers();

    act(() => {
      observers[0]?.trigger(true);
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("shows loading skeletons for the initial load and next-page fetches", async () => {
    useShowsBrowseMock.mockReturnValueOnce({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: true,
    });

    const loadingRender = await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    expect(loadingRender.getAllByTestId("show-card-skeleton")).toHaveLength(12);
    loadingRender.unmount();

    useShowsBrowseMock.mockReturnValue({
      data: { pages: [{ items: [makeTvShow({ title: "Ted Lasso" })] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isError: false,
      isFetchingNextPage: true,
      isLoading: false,
    });

    const nextPageRender = await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    expect(nextPageRender.getAllByTestId("show-card-skeleton")).toHaveLength(6);
  });

  it("shows error state and opens or closes edit and delete dialogs", async () => {
    const user = userEvent.setup();

    useShowsBrowseMock.mockReturnValueOnce({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isLoading: false,
    });

    const errorRender = await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    expect(screen.getByText("Failed to load shows. Please try again.")).toBeInTheDocument();
    errorRender.unmount();

    useShowsBrowseMock.mockReturnValue({
      data: { pages: [{ items: [makeTvShow({ title: "Ted Lasso" })] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });

    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    await user.click(screen.getByRole("button", { name: "New Show" }));
    expect(screen.getByText("Create show dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close show dialog" }));
    expect(screen.queryByRole("button", { name: "Close show dialog" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Ted Lasso" }));
    expect(screen.getAllByText("Edit Ted Lasso").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close show dialog" }));
    expect(screen.queryByRole("button", { name: "Close show dialog" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Ted Lasso" }));
    expect(screen.getByRole("button", { name: "Close delete show" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close delete show" }));
    expect(screen.queryByRole("button", { name: "Close delete show" })).not.toBeInTheDocument();
  });
});
