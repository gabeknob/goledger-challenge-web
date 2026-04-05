import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderAppRoute } from "#/test/test-utils";
import { makeEpisode, makeSeason, makeTvShow } from "#/test/factories";
import type { ShowCascadePlan, ShowCascadeTaskStatus } from "#/hooks/useShows";
import { Route as ShowDetailRoute } from "#/routes/_auth/shows/$showId/index";

const useShowsMock = vi.fn();
const useShowMock = vi.fn();
const useSeasonsMock = vi.fn();
const useEpisodesMock = vi.fn();
const useTMDBMock = vi.fn();
const useTMDBEpisodeStillMock = vi.fn();

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
  useShows: () => useShowsMock(),
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

vi.mock("#/components/Navbar", () => ({
  Navbar: () => null,
}));

vi.mock("#/components/Breadcrumbs", () => ({
  Breadcrumbs: () => null,
}));

vi.mock("#/components/BottomTabBar", () => ({
  BottomTabBar: () => null,
}));

vi.mock("#/components/WatchlistMembershipPopover", () => ({
  WatchlistMembershipPopover: ({ show }: { show?: { title: string } }) =>
    show ? <button type="button">+ Watchlist</button> : null,
}));

vi.mock("#/components/ResponsiveActionMenu", () => ({
  ResponsiveActionMenu: ({
    actions,
  }: {
    actions: Array<{ destructive?: boolean; label: string; onSelect: () => void }>;
  }) => (
    <div>
      {actions.map(action => (
        <button key={action.label} type="button" onClick={action.onSelect}>
          {action.label}
        </button>
      ))}
    </div>
  ),
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

vi.mock("#/components/ShowFormDialog", () => ({
  ShowFormDialog: ({ open }: { open: boolean }) => (open ? <div>Edit show dialog</div> : null),
}));

vi.mock("#/components/SeasonFormDialog", () => ({
  SeasonFormDialog: ({
    mode,
    onOpenChange,
    open,
    season,
  }: {
    mode: "create" | "edit";
    onOpenChange: (open: boolean) => void;
    open: boolean;
    season?: { number: number } | null;
  }) =>
    open ? (
      <div>
        <div>{mode === "create" ? "Create season dialog" : `Edit season ${season?.number}`}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close season dialog
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/EpisodeFormDialog", () => ({
  EpisodeFormDialog: ({
    mode,
    onOpenChange,
    open,
    episode,
  }: {
    mode: "create" | "edit";
    onOpenChange: (open: boolean) => void;
    open: boolean;
    episode?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>{mode === "create" ? "Create episode dialog" : `Edit ${episode?.title}`}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close episode dialog
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/DeleteEpisodeDialog", () => ({
  DeleteEpisodeDialog: ({
    episode,
    onOpenChange,
    open,
  }: {
    episode?: { title: string } | null;
    onOpenChange: (open: boolean) => void;
    open: boolean;
  }) =>
    open ? (
      <div>
        <div>Delete {episode?.title}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close delete episode
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/DeleteSeasonDialog", () => ({
  DeleteSeasonDialog: ({
    onDeleted,
    onOpenChange,
    open,
    season,
  }: {
    onDeleted: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
    season?: { number: number } | null;
  }) =>
    open ? (
      <div>
        <div>Delete season {season?.number}</div>
        <button type="button" onClick={onDeleted}>
          Confirm delete season
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close delete season
        </button>
      </div>
    ) : null,
}));

vi.mock("#/components/DeleteShowDialog", () => ({
  DeleteShowDialog: ({
    onDeletingChange,
    onOpenChange,
    onPlanChange,
    onTaskStatusChange,
    open,
    show,
  }: {
    onDeletingChange?: (deleting: boolean) => void;
    onOpenChange: (open: boolean) => void;
    onPlanChange?: (plan: ShowCascadePlan | null) => void;
    onTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
    open: boolean;
    show?: { title: string } | null;
  }) =>
    open ? (
      <div>
        <div>Delete show {show?.title}</div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close delete show
        </button>
        <button
          type="button"
          onClick={() => {
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
            onDeletingChange?.(true);
          }}
        >
          Start delete show
        </button>
      </div>
    ) : null,
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
    useShowsMock.mockReturnValue({ data: [show] });
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the season search param", () => {
    expect(ShowDetailRoute.options.validateSearch?.({ season: "2" })).toEqual({ season: 2 });
    expect(ShowDetailRoute.options.validateSearch?.({ season: "   " })).toEqual({ season: undefined });
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
  });

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
    expect(screen.getByText("Create season dialog")).toBeInTheDocument();
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
    expect(screen.getByText("Create episode dialog")).toBeInTheDocument();
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
    expect(screen.getByText("Delete season 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm delete season" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ season: 1 });
    });
  });

  it("opens edit dialogs and shows the cascade deletion progress screen", async () => {
    const user = userEvent.setup();

    await renderAppRoute("/shows/Ted%20Lasso?season=1");

    await user.click(screen.getByRole("button", { name: "Edit Show" }));
    expect(screen.getByText("Edit show dialog")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(screen.getByText("Edit season 1")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Edit" })[2]!);
    expect(screen.getByText("Edit Pilot")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Show" }));
    expect(screen.getByText("Delete show Ted Lasso")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start delete show" }));

    expect(screen.getByText("Deleting Show")).toBeInTheDocument();
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
  });
});
