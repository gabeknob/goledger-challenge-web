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
  ShowCard: ({ show }: { show: { title: string } }) => <div>{show.title}</div>,
  ShowCardSkeleton: () => <div data-testid="show-card-skeleton">Loading</div>,
}));

vi.mock("#/components/ShowFormDialog", () => ({
  ShowFormDialog: () => null,
}));

vi.mock("#/components/DeleteShowDialog", () => ({
  DeleteShowDialog: () => null,
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
    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    expect(screen.getByText("No shows yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add your first show" })).toBeInTheDocument();
  });

  it("shows the no-results state for an unmatched search", async () => {
    const user = userEvent.setup();

    await renderRoute({
      component: ShowsPage,
      path: "/shows",
    });

    await user.type(screen.getByPlaceholderText("Search shows…"), "bleach");

    expect(await screen.findByText('No shows matching "bleach"')).toBeInTheDocument();
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
});
