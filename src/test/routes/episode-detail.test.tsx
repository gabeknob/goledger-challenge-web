import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { makeEpisode, makeSeason, makeTvShow } from "#/test/factories";
import { queryClient } from "#/lib/queryClient";
import { EpisodeDetailPage, episodeDetailRouteApi } from "#/pages/_auth/shows/EpisodeDetailPage";
import { Route as EpisodeRoute } from "#/routes/_auth/shows/$showId/episodes/$episode";

const createEpisodeMutateAsyncMock = vi.fn();
const deleteEpisodeMutateAsyncMock = vi.fn();
const useEpisodeMock = vi.fn();
const useEpisodeHistoryMock = vi.fn();
const useEpisodesMock = vi.fn();
const useSeasonsMock = vi.fn();
const useShowMock = vi.fn();
const useTMDBEpisodeStillMock = vi.fn();
const updateEpisodeMutateAsyncMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("#/hooks/useShowDetail", () => ({
  useEpisode: (...args: unknown[]) => useEpisodeMock(...args),
  useEpisodeHistory: (...args: unknown[]) => useEpisodeHistoryMock(...args),
  useEpisodes: (...args: unknown[]) => useEpisodesMock(...args),
  useSeasons: (...args: unknown[]) => useSeasonsMock(...args),
  useShow: (...args: unknown[]) => useShowMock(...args),
}));

vi.mock("#/hooks/useTMDB", () => ({
  useTMDBEpisodeStill: (...args: unknown[]) => useTMDBEpisodeStillMock(...args),
}));

vi.mock("#/hooks/useEpisodes", () => ({
  useCreateEpisode: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => createEpisodeMutateAsyncMock(...args),
  }),
  useDeleteEpisode: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => deleteEpisodeMutateAsyncMock(...args),
  }),
  useUpdateEpisode: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => updateEpisodeMutateAsyncMock(...args),
  }),
}));

describe("episode detail route", () => {
  beforeEach(() => {
    createEpisodeMutateAsyncMock.mockReset();
    deleteEpisodeMutateAsyncMock.mockReset();
    updateEpisodeMutateAsyncMock.mockReset();
    vi.spyOn(episodeDetailRouteApi, "useParams").mockReturnValue({
      episode: "s1e1",
      showId: "Ted%20Lasso",
    } as never);
    vi.spyOn(episodeDetailRouteApi, "useLoaderData").mockReturnValue({
      crumb: "S1E1",
      episodeNumber: 1,
      seasonNumber: 1,
    });
    vi.spyOn(episodeDetailRouteApi, "useNavigate").mockReturnValue(navigateMock);

    useShowMock.mockReturnValue({
      data: makeTvShow({ title: "Ted Lasso" }),
      isError: false,
      isLoading: false,
    });
    useSeasonsMock.mockReturnValue({
      data: [makeSeason()],
    });
    useEpisodesMock.mockReturnValue({
      data: [makeEpisode()],
    });
    useEpisodeMock.mockReturnValue({
      data: makeEpisode(),
      error: null,
      isError: false,
      isLoading: false,
    });
    useEpisodeHistoryMock.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    });
    useTMDBEpisodeStillMock.mockReturnValue({
      imageUrl: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("rejects malformed episode params and exposes the expected loader label", () => {
    expect(() =>
      EpisodeRoute.options.beforeLoad?.({
        params: { episode: "bad-param" },
      } as never),
    ).toThrow('Episode URL must follow the "s3e10" format.');
    const loader = EpisodeRoute.options.loader as ((context: unknown) => unknown) | undefined;

    expect(
      loader?.({
        params: { episode: "s3e10" },
      }),
    ).toEqual({
      crumb: "S3E10",
      episodeNumber: 10,
      seasonNumber: 3,
    });
  });

  it("renders the not found state when the show query fails", async () => {
    const user = userEvent.setup();
    useShowMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    });

    render(<EpisodeDetailPage />);

    expect(screen.getByText("TV show not found")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to shows" }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/shows",
    });
  });

  it("expands blockchain history and toggles the JSON snapshot", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso" });
    const season = makeSeason({
      "@key": "seasons:ted-lasso:1",
      number: 1,
      tvShow: {
        "@assetType": "tvShows",
        "@key": show["@key"],
      },
    });
    const episode = makeEpisode({
      "@key": "episodes:ted-lasso:1",
      episodeNumber: 1,
      season: {
        "@assetType": "seasons",
        "@key": season["@key"],
      },
      title: "Pilot",
    });

    useShowMock.mockReturnValue({
      data: show,
      isError: false,
      isLoading: false,
    });
    useSeasonsMock.mockReturnValue({
      data: [season],
    });
    useEpisodesMock.mockReturnValue({
      data: [episode],
    });
    useEpisodeMock.mockReturnValue({
      data: episode,
      error: null,
      isError: false,
      isLoading: false,
    });
    useEpisodeHistoryMock.mockReturnValue({
      data: [
        {
          ...episode,
          "@lastTx": "updateAsset",
          _isDelete: false,
          _timestamp: "2026-01-01T12:00:00.000Z",
          _txId: "tx-123",
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });

    render(<EpisodeDetailPage />);

    expect(screen.getByRole("heading", { name: "Pilot" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /blockchain history/i }));
    expect(screen.getByText("TX tx-123")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show JSON snapshot" }));

    expect(screen.getByText(/"title": "Pilot"/)).toBeInTheDocument();
    expect(screen.queryByText(/"_timestamp"/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide JSON snapshot" }));
    expect(screen.queryByText(/"title": "Pilot"/)).not.toBeInTheDocument();
  });

  it("renders loading states while the episode and blockchain history are loading", async () => {
    const user = userEvent.setup();

    useEpisodeMock.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
    });
    useEpisodeHistoryMock.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: true,
    });

    render(<EpisodeDetailPage />);

    expect(screen.getByText("Loading on-chain history...")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /blockchain history/i }));

    expect(screen.queryByText("No blockchain history was found.")).not.toBeInTheDocument();
  });

  it("renders the not found state when the episode query fails and returns to the season view", async () => {
    const user = userEvent.setup();
    useEpisodeMock.mockReturnValue({
      data: undefined,
      error: new Error("Episode was not found."),
      isError: true,
      isLoading: false,
    });

    render(<EpisodeDetailPage />);

    expect(screen.getByText("Episode not found")).toBeInTheDocument();
    expect(screen.getByText("Episode was not found.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to Ted Lasso" }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/shows/$showId",
      params: { showId: "Ted%20Lasso" },
      search: { season: 1 },
      resetScroll: false,
    });
  });

  it("falls back to the generic missing-episode copy when the query error is not an Error", () => {
    useEpisodeMock.mockReturnValue({
      data: undefined,
      error: "missing",
      isError: true,
      isLoading: false,
    });

    render(<EpisodeDetailPage />);

    expect(
      screen.getByText("This episode doesn't exist or may have been removed."),
    ).toBeInTheDocument();
  });

  it("renders fallback metadata when the episode is missing optional fields", async () => {
    const user = userEvent.setup();
    const show = makeTvShow({ title: "Ted Lasso" });
    const season = makeSeason({
      "@key": "seasons:ted-lasso:2",
      number: 2,
      tvShow: {
        "@assetType": "tvShows",
        "@key": show["@key"],
      },
    });
    const priorSeason = makeSeason({
      "@key": "seasons:ted-lasso:1",
      number: 1,
      tvShow: {
        "@assetType": "tvShows",
        "@key": show["@key"],
      },
    });
    const priorEpisode = makeEpisode({
      "@key": "episodes:ted-lasso:1:24",
      episodeNumber: 24,
      season: {
        "@assetType": "seasons",
        "@key": priorSeason["@key"],
      },
      title: "Finale",
    });
    const episode = makeEpisode({
      "@key": "episodes:ted-lasso:2:1",
      "@lastUpdated": "invalid-date",
      episodeNumber: 1,
      rating: undefined,
      releaseDate: "invalid-date",
      season: {
        "@assetType": "seasons",
        "@key": season["@key"],
      },
      title: "New Day",
    });

    vi.spyOn(episodeDetailRouteApi, "useParams").mockReturnValue({
      episode: "s2e1",
      showId: "Ted%20Lasso",
    } as never);
    vi.spyOn(episodeDetailRouteApi, "useLoaderData").mockReturnValue({
      crumb: "S2E1",
      episodeNumber: 1,
      seasonNumber: 2,
    });

    useShowMock.mockReturnValue({
      data: show,
      isError: false,
      isLoading: false,
    });
    useSeasonsMock.mockReturnValue({
      data: [priorSeason, season],
    });
    useEpisodesMock.mockReturnValue({
      data: [priorEpisode, episode],
    });
    useEpisodeMock.mockReturnValue({
      data: episode,
      error: null,
      isError: false,
      isLoading: false,
    });

    render(<EpisodeDetailPage />);

    expect(useTMDBEpisodeStillMock).toHaveBeenCalledWith({
      episodeNumber: 1,
      fallbackEpisodeNumber: 2,
      seasonNumber: 2,
      showTitle: "Ted Lasso",
    });
    expect(screen.getByText("Not rated")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown date").length).toBeGreaterThan(0);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Unknown time")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Episode" }));
    expect(screen.getByRole("heading", { name: "Edit Episode" })).toBeInTheDocument();

    const episodeNumberInput = screen.getByLabelText("Episode number");
    await user.clear(episodeNumberInput);
    await user.type(episodeNumberInput, "7");
    await user.clear(screen.getByLabelText("Release date"));
    await user.type(screen.getByLabelText("Release date"), "2024-03-01T10:30");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/shows/$showId/episodes/$episode",
        params: {
          showId: "Ted%20Lasso",
          episode: "s2e7",
        },
        resetScroll: false,
      });
    });
  });

  it("opens the delete dialog and navigates back to the season after deletion", async () => {
    const user = userEvent.setup();

    render(<EpisodeDetailPage />);

    await user.click(screen.getByRole("button", { name: "Delete Episode" }));

    expect(screen.getByText("Delete episode?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Episode" }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/shows/$showId",
      params: { showId: "Ted%20Lasso" },
      search: { season: 1 },
      resetScroll: false,
    });
  });

  it("renders the empty and error states inside the history panel", async () => {
    const user = userEvent.setup();

    const { rerender } = render(<EpisodeDetailPage />);

    await user.click(screen.getByRole("button", { name: /blockchain history/i }));
    expect(screen.getByText("No blockchain history was found.")).toBeInTheDocument();

    useEpisodeHistoryMock.mockReturnValue({
      data: [],
      error: "boom",
      isError: true,
      isLoading: false,
    });

    rerender(<EpisodeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Could not load blockchain history.")).toBeInTheDocument();
    });
  });

  it("renders delete entries and still fallback artwork when no TMDB image exists", async () => {
    const user = userEvent.setup();
    const episode = makeEpisode({
      "@lastTx": undefined,
      "@lastUpdated": "2026-01-02T12:00:00.000Z",
      title: "No Still",
    });

    useEpisodeMock.mockReturnValue({
      data: episode,
      error: null,
      isError: false,
      isLoading: false,
    });
    useEpisodeHistoryMock.mockReturnValue({
      data: [
        {
          ...episode,
          "@lastTx": undefined,
          _isDelete: true,
          _timestamp: "2026-01-03T12:00:00.000Z",
          _txId: "tx-delete",
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });

    render(<EpisodeDetailPage />);

    expect(screen.queryByAltText("No Still still")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /blockchain history/i }));

    expect(screen.getByText("deleteAsset")).toBeInTheDocument();
  });

  it("renders the TMDB still and missing-date fallback when available data is sparse", () => {
    const episode = {
      ...makeEpisode({
        "@lastUpdated": undefined,
        rating: 7.4,
        title: "With Still",
      }),
      releaseDate: undefined as unknown as string,
    };

    useEpisodeMock.mockReturnValue({
      data: episode,
      error: null,
      isError: false,
      isLoading: false,
    });
    useTMDBEpisodeStillMock.mockReturnValue({
      imageUrl: "https://image.tmdb.org/t/p/original/still.jpg",
    });

    render(<EpisodeDetailPage />);

    expect(screen.getByAltText("With Still still")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown date").length).toBeGreaterThan(0);
  });
});
