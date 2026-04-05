import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderAppRoute } from "#/test/test-utils";
import { makeEpisode, makeSeason, makeTvShow } from "#/test/factories";
import { Route as ShowDetailRoute } from "#/routes/_auth/shows/$showId/index";

const useCascadeDeleteShowMock = vi.fn();
const useCreateEpisodeMock = vi.fn();
const useCreateShowMock = vi.fn();
const useDeleteEpisodeMock = vi.fn();
const useCreateSeasonMock = vi.fn();
const useDeleteSeasonMock = vi.fn();
const useShowsBrowseMock = vi.fn();
const useShowsMock = vi.fn();
const useShowMock = vi.fn();
const useSeasonsMock = vi.fn();
const useEpisodesMock = vi.fn();
const useCreateWatchlistMock = vi.fn();
const useTMDBMock = vi.fn();
const useTMDBEpisodeStillMock = vi.fn();
const useUpdateEpisodeMock = vi.fn();
const useUpdateSeasonMock = vi.fn();
const useUpdateShowMock = vi.fn();
const useUpdateWatchlistMock = vi.fn();
const useWatchlistsMock = vi.fn();

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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
  useCreateShow: () => useCreateShowMock(),
  useShowsBrowse: (...args: unknown[]) => useShowsBrowseMock(...args),
  useShows: () => useShowsMock(),
  useCascadeDeleteShow: () => useCascadeDeleteShowMock(),
  useUpdateShow: () => useUpdateShowMock(),
}));

vi.mock("#/hooks/useShowDetail", () => ({
  useShow: (...args: unknown[]) => useShowMock(...args),
  useSeasons: (...args: unknown[]) => useSeasonsMock(...args),
  useEpisodes: (...args: unknown[]) => useEpisodesMock(...args),
}));

vi.mock("#/hooks/useTMDB", () => ({
  useTMDB: (...args: unknown[]) => useTMDBMock(...args),
  useTMDBEpisodeStill: (...args: unknown[]) => useTMDBEpisodeStillMock(...args),
}));

vi.mock("#/hooks/useSeasons", () => ({
  useCreateSeason: () => useCreateSeasonMock(),
  useDeleteSeason: () => useDeleteSeasonMock(),
  useUpdateSeason: () => useUpdateSeasonMock(),
}));

vi.mock("#/hooks/useEpisodes", () => ({
  useCreateEpisode: () => useCreateEpisodeMock(),
  useDeleteEpisode: () => useDeleteEpisodeMock(),
  useUpdateEpisode: () => useUpdateEpisodeMock(),
}));

vi.mock("#/hooks/useWatchlists", () => ({
  useCreateWatchlist: () => useCreateWatchlistMock(),
  useUpdateWatchlist: () => useUpdateWatchlistMock(),
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
    onSelect?: () => void;
  }) => (
    <button type="button" onClick={() => onSelect?.()}>
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

vi.mock("#/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("#/components/ui/command", () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandInput: ({
    "aria-label": ariaLabel,
    onChange,
    placeholder,
    value,
  }: {
    "aria-label"?: string;
    onChange?: (event: { target: { value: string } }) => void;
    placeholder?: string;
    value?: string;
  }) => (
    <input
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={event => onChange?.({ target: { value: event.target.value } })}
    />
  ),
  CommandItem: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandSeparator: () => <hr />,
}));

describe("show detail route", () => {
  const show = makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted-lasso" });
  const seasonOne = makeSeason({
    number: 1,
    "@key": "seasons:ted-lasso:1",
    tvShow: { "@assetType": "tvShows", "@key": show["@key"] },
  });
  const seasonTwo = makeSeason({
    number: 2,
    "@key": "seasons:ted-lasso:2",
    tvShow: { "@assetType": "tvShows", "@key": show["@key"] },
  });

  beforeEach(() => {
    useCascadeDeleteShowMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(async ({ onPlanChange, onTaskStatusChange }) => {
        onPlanChange?.({
          deletedEpisodes: 2,
          deletedSeasons: 1,
          updatedWatchlists: 1,
          tasks: [
            {
              id: "remove-watchlist-reference",
              kind: "watchlist",
              label: 'Remove "Ted Lasso" from watchlists',
            },
            {
              id: "delete-show",
              kind: "show",
              label: 'Delete show "Ted Lasso"',
            },
          ],
        });
        onTaskStatusChange?.("remove-watchlist-reference", "completed");
        onTaskStatusChange?.("delete-show", "running");

        return {
          deletedEpisodes: 2,
          deletedSeasons: 1,
          updatedWatchlists: 1,
        };
      }),
    });
    useCreateShowMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useCreateSeasonMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useUpdateSeasonMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useDeleteSeasonMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useCreateEpisodeMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useCreateWatchlistMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useUpdateEpisodeMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useDeleteEpisodeMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useUpdateShowMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useUpdateWatchlistMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useShowsMock.mockReturnValue({ data: [show] });
    useShowsBrowseMock.mockReturnValue({
      data: { pages: [{ items: [show], bookmark: null }], pageParams: [undefined] },
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
    });
    useShowMock.mockReturnValue({
      data: show,
      isLoading: false,
      isError: false,
    });
    useSeasonsMock.mockReturnValue({
      data: [seasonOne, seasonTwo],
      isLoading: false,
      isError: false,
    });
    useEpisodesMock.mockReturnValue({
      data: [
        makeEpisode({
          title: "Pilot",
          episodeNumber: 1,
          season: { "@assetType": "seasons", "@key": seasonOne["@key"] },
        }),
        makeEpisode({
          title: "Goodbye Earl",
          episodeNumber: 1,
          season: { "@assetType": "seasons", "@key": seasonTwo["@key"] },
        }),
      ],
      isLoading: false,
      isError: false,
    });
    useTMDBMock.mockReturnValue({ imageUrl: null });
    useTMDBEpisodeStillMock.mockReturnValue({ imageUrl: null });
    useWatchlistsMock.mockReturnValue({ data: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the season search param", () => {
    const validateSearch = ShowDetailRoute.options.validateSearch;

    if (typeof validateSearch !== "function") {
      throw new Error("Expected show detail validateSearch to be callable.");
    }

    expect(validateSearch({ season: "2" })).toEqual({ season: 2 });
    expect(validateSearch({ season: "   " })).toEqual({ season: undefined });
  });

  it("renders the not-found state when the show query fails", async () => {
    useShowMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    await renderAppRoute("/shows/Missing%20Show?season=1");

    expect(screen.getByText("TV show not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to shows" })).toBeInTheDocument();
  }, 15000);

  it("redirects to the first season when the route has no season search param", async () => {
    const { router } = await renderAppRoute("/shows/Ted%20Lasso");

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ season: 1 });
    });
  });

  it("shows the empty season state and opens the create season dialog", async () => {
    const user = userEvent.setup();

    useSeasonsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    useEpisodesMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    await renderAppRoute("/shows/Ted%20Lasso?season=1");

    expect(screen.getByText("No seasons yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add a Season" }));
    expect(screen.getByRole("heading", { name: "Add Season" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
  });

  it("shows season and episode loading or error states independently", async () => {
    useSeasonsMock.mockReturnValueOnce({
      data: [],
      isLoading: true,
      isError: false,
    });

    await renderAppRoute("/shows/Ted%20Lasso?season=1");
    expect(screen.getByText("Show Detail")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

    useSeasonsMock.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: true,
    });

    await renderAppRoute("/shows/Ted%20Lasso?season=1");
    expect(screen.getByText("Failed to load seasons. Please try again.")).toBeInTheDocument();

    useEpisodesMock.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: true,
    });

    await renderAppRoute("/shows/Ted%20Lasso?season=1");
    expect(screen.getByText("Failed to load episodes. Please try again.")).toBeInTheDocument();
  });

  it("shows the empty episode state and opens the create episode dialog", async () => {
    const user = userEvent.setup();

    useSeasonsMock.mockReturnValue({
      data: [seasonOne],
      isLoading: false,
      isError: false,
    });
    useEpisodesMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    await renderAppRoute("/shows/Ted%20Lasso?season=1");

    expect(screen.getByText("No episodes yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add an Episode" }));
    expect(screen.getByText("Add Episode")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
  });

  it("navigates between seasons and redirects after deleting the active season", async () => {
    const user = userEvent.setup();

    const { router } = await renderAppRoute("/shows/Ted%20Lasso?season=1");

    expect(screen.getByText("Pilot")).toBeInTheDocument();
    expect(screen.queryByText("Goodbye Earl")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Season 2" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ season: 2 });
    });
    expect(screen.getByText("Goodbye Earl")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Delete" })[1]!);
    expect(screen.getByText("Delete season and episodes?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ season: 1 });
    });
  }, 20000);

  it("opens edit dialogs and shows the cascade deletion progress screen", async () => {
    const user = userEvent.setup();

    useCascadeDeleteShowMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(async ({ onPlanChange, onTaskStatusChange }) => {
        queueMicrotask(() => {
          onPlanChange?.({
            deletedEpisodes: 2,
            deletedSeasons: 1,
            updatedWatchlists: 1,
            tasks: [
              {
                id: "remove-watchlist-reference",
                kind: "watchlist",
                label: 'Remove "Ted Lasso" from watchlists',
              },
              {
                id: "delete-show",
                kind: "show",
                label: 'Delete show "Ted Lasso"',
              },
            ],
          });
          onTaskStatusChange?.("remove-watchlist-reference", "completed");
          onTaskStatusChange?.("delete-show", "running");
        });

        return await new Promise<never>(() => {});
      }),
    });

    await renderAppRoute("/shows/Ted%20Lasso?season=1");

    await user.click(screen.getByRole("button", { name: "Edit Show" }));
    expect(screen.getByRole("heading", { name: "Edit Show" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(screen.getByRole("heading", { name: "Edit Season" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getAllByRole("button", { name: "Edit" })[2]!);
    expect(screen.getByRole("heading", { name: "Edit Episode" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Delete Show" }));
    expect(screen.getByText("Delete show and related data?")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Type/i), "delete Ted Lasso");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.getByText("Deleting Show")).toBeInTheDocument();
    });
    expect(screen.getByText("Removing Ted Lasso")).toBeInTheDocument();
    expect(screen.getByText('Remove "Ted Lasso" from watchlists')).toBeInTheDocument();
    expect(screen.getByText('Delete show "Ted Lasso"')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          (element.textContent?.includes("We found 2 cleanup steps for this cascade deletion.") ??
            false),
      ),
    ).toHaveTextContent("This can take a moment.");
  }, 30000);
});
