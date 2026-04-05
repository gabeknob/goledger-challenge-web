import type { ReactNode } from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShowsPage } from "#/routes/_auth/shows/index";
import { getIntersectionObservers } from "#/test/browser-mocks";
import { makeTvShow } from "#/test/factories";
import { renderRoute } from "#/test/test-utils";

const useCascadeDeleteShowMock = vi.fn();
const useCreateShowMock = vi.fn();
const useDebouncedStateMock = vi.fn();
const useShowsBrowseMock = vi.fn();
const useTMDBMock = vi.fn();
const useUpdateShowMock = vi.fn();

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => true),
  };
});

vi.mock("#/hooks/useShows", () => ({
  useCascadeDeleteShow: () => useCascadeDeleteShowMock(),
  useCreateShow: () => useCreateShowMock(),
  useShowsBrowse: (...args: unknown[]) => useShowsBrowseMock(...args),
  useUpdateShow: () => useUpdateShowMock(),
}));

vi.mock("#/hooks/useDebouncedState", () => ({
  useDebouncedState: (...args: unknown[]) => useDebouncedStateMock(...args),
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

vi.mock("#/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: () => void;
  }) => (
    <button type="button" onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("/shows page", () => {
  beforeEach(() => {
    useCascadeDeleteShowMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({
        deletedEpisodes: 0,
        deletedSeasons: 0,
        updatedWatchlists: 0,
      }),
    });
    useCreateShowMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useShowsBrowseMock.mockReturnValue({
      data: { pages: [{ items: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });
    useTMDBMock.mockReturnValue({ imageUrl: null });
    useUpdateShowMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
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
    expect(screen.getByRole("heading", { name: "New Show" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
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

    expect(loadingRender.container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
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

    expect(nextPageRender.container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
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
    expect(screen.getByRole("heading", { name: "New Show" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "New Show" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Edit Show" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "Edit Show" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete show and related data?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete show and related data?")).not.toBeInTheDocument();
  });
});
