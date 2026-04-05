import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  useEpisode,
  useEpisodeHistory,
  useEpisodes,
  useSeasons,
  useShow,
} from "#/hooks/useShowDetail";
import { api } from "#/lib/api";
import { makeEpisode, makeSeason, makeTvShow } from "#/test/factories";

vi.mock("#/lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useShowDetail", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a show by title", async () => {
    const show = makeTvShow({ title: "Ted Lasso" });
    vi.mocked(api.post).mockResolvedValue({ data: show } as never);

    const { result } = renderHook(() => useShow("Ted Lasso"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(show);
    });

    expect(api.post).toHaveBeenCalledWith("/query/readAsset", {
      key: {
        "@assetType": "tvShows",
        title: "Ted Lasso",
      },
    });
  });

  it("keeps show queries disabled when the title is empty", () => {
    const { result } = renderHook(() => useShow(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("fetches seasons and sorts them by number", async () => {
    const first = makeSeason({
      "@key": "seasons:2",
      number: 2,
      tvShow: { "@assetType": "tvShows", "@key": "tvShows:ted" },
    });
    const second = makeSeason({
      "@key": "seasons:1",
      number: 1,
      tvShow: { "@assetType": "tvShows", "@key": "tvShows:ted" },
    });
    const unrelated = makeSeason({
      "@key": "seasons:other",
      number: 1,
      tvShow: { "@assetType": "tvShows", "@key": "tvShows:other" },
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        result: [first, unrelated, second],
      },
    } as never);

    const { result } = renderHook(() => useSeasons("tvShows:ted"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([second, first]);
    });
  });

  it("returns episodes for only the requested season keys and sorts by number", async () => {
    const episodeTwo = makeEpisode({
      "@key": "episodes:2",
      episodeNumber: 2,
      season: { "@assetType": "seasons", "@key": "seasons:1" },
    });
    const episodeOne = makeEpisode({
      "@key": "episodes:1",
      episodeNumber: 1,
      season: { "@assetType": "seasons", "@key": "seasons:1" },
    });
    const unrelated = makeEpisode({
      "@key": "episodes:other",
      episodeNumber: 1,
      season: { "@assetType": "seasons", "@key": "seasons:2" },
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        result: [episodeTwo, unrelated, episodeOne],
      },
    } as never);

    const { result } = renderHook(() => useEpisodes(["seasons:1"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([episodeOne, episodeTwo]);
    });
  });

  it("keeps episode lists disabled when no season keys are provided", () => {
    const { result } = renderHook(() => useEpisodes([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("fetches a specific episode from the matching season", async () => {
    const season = makeSeason({
      "@key": "seasons:ted:1",
      number: 1,
      tvShow: { "@assetType": "tvShows", "@key": "tvShows:ted" },
    });
    const episode = makeEpisode({
      "@key": "episodes:ted:1",
      episodeNumber: 1,
      season: { "@assetType": "seasons", "@key": season["@key"] },
      title: "Pilot",
    });
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          result: [season],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          result: [episode],
        },
      } as never);

    const { result } = renderHook(() => useEpisode("tvShows:ted", 1, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(episode);
    });
  });

  it("returns a helpful error when the season is missing", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        result: [],
      },
    } as never);

    const { result } = renderHook(() => useEpisode("tvShows:ted", 2, 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error("Season 2 was not found for this show."));
    });
  });

  it("returns a helpful error when the episode is missing", async () => {
    const season = makeSeason({
      "@key": "seasons:ted:1",
      number: 1,
      tvShow: { "@assetType": "tvShows", "@key": "tvShows:ted" },
    });
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          result: [season],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          result: [],
        },
      } as never);

    const { result } = renderHook(() => useEpisode("tvShows:ted", 1, 4), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error("Episode 4 was not found in Season 1."));
    });
  });

  it("keeps episode detail disabled when the inputs are incomplete", () => {
    const { result } = renderHook(() => useEpisode(undefined, 1, 1), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("fetches and sorts episode history newest first", async () => {
    const episode = makeEpisode({
      "@key": "episodes:ted:1",
      episodeNumber: 1,
      season: { "@assetType": "seasons", "@key": "seasons:ted:1" },
    });
    vi.mocked(api.post).mockResolvedValue({
      data: [
        {
          ...episode,
          _isDelete: false,
          _timestamp: "2025-01-01T12:00:00.000Z",
          _txId: "older",
        },
        {
          ...episode,
          _isDelete: false,
          _timestamp: "2025-01-02T12:00:00.000Z",
          _txId: "newer",
        },
      ],
    } as never);

    const { result } = renderHook(() => useEpisodeHistory(episode), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.map(entry => entry._txId)).toEqual(["newer", "older"]);
    });
  });

  it("keeps episode history disabled when there is no episode", () => {
    const { result } = renderHook(() => useEpisodeHistory(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(api.post).not.toHaveBeenCalled();
  });
});
