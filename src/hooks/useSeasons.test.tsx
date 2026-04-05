import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { useCreateSeason, useDeleteSeason, useUpdateSeason } from "#/hooks/useSeasons";
import { queryClient } from "#/lib/queryClient";
import { api } from "#/lib/api";
import { makeEpisode, makeSeason } from "#/test/factories";

vi.mock("#/lib/api", () => ({
  api: {
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useSeasons", () => {
  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("creates a season and invalidates seasons and episodes queries", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const season = makeSeason();

    const { result } = renderHook(() => useCreateSeason(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      number: season.number,
      show: season.tvShow,
      year: season.year,
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
        asset: [
          {
            "@assetType": "seasons",
            number: season.number,
            tvShow: season.tvShow,
            year: season.year,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["seasons", season.tvShow["@key"]],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["episodes"],
      });
    });
  });

  it("cascades season deletion through episodes before deleting the season", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const season = makeSeason({ number: 2 });
    const firstEpisode = makeEpisode({
      episodeNumber: 1,
      season: { "@assetType": "seasons", "@key": season["@key"] },
      title: "Aftermath",
    });
    const secondEpisode = makeEpisode({
      episodeNumber: 2,
      season: { "@assetType": "seasons", "@key": season["@key"] },
      title: "Second Wind",
    });
    const onTaskStatusChange = vi.fn();

    const { result } = renderHook(() => useDeleteSeason(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      episodes: [firstEpisode, secondEpisode],
      onTaskStatusChange,
      season,
    });

    expect(onTaskStatusChange.mock.calls).toEqual([
      [`episode:${firstEpisode["@key"]}`, "running"],
      [`episode:${firstEpisode["@key"]}`, "completed"],
      [`episode:${secondEpisode["@key"]}`, "running"],
      [`episode:${secondEpisode["@key"]}`, "completed"],
      [`season:${season["@key"]}`, "running"],
      [`season:${season["@key"]}`, "completed"],
    ]);

    expect(api.delete).toHaveBeenNthCalledWith(1, "/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "episodes",
          episodeNumber: firstEpisode.episodeNumber,
          season: firstEpisode.season,
        },
      },
    });
    expect(api.delete).toHaveBeenNthCalledWith(2, "/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "episodes",
          episodeNumber: secondEpisode.episodeNumber,
          season: secondEpisode.season,
        },
      },
    });
    expect(api.delete).toHaveBeenNthCalledWith(3, "/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "seasons",
          number: season.number,
          tvShow: season.tvShow,
        },
      },
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["seasons", season.tvShow["@key"]],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["episodes"],
      });
    });
  });

  it("updates a season year and invalidates related queries", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const season = makeSeason({
      number: 2,
      year: 2022,
    });

    const { result } = renderHook(() => useUpdateSeason(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current: season,
      next: {
        number: season.number,
        year: 2024,
      },
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/invoke/updateAsset", {
        update: {
          "@assetType": "seasons",
          number: season.number,
          tvShow: season.tvShow,
          year: 2024,
        },
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["seasons", season.tvShow["@key"]],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["episodes"],
    });
  });

  it("marks the season task as failed when deleting the season itself fails", async () => {
    const season = makeSeason({ number: 3 });
    const episode = makeEpisode({
      episodeNumber: 1,
      season: { "@assetType": "seasons", "@key": season["@key"] },
      title: "Opening",
    });
    const onTaskStatusChange = vi.fn();
    vi.mocked(api.delete)
      .mockResolvedValueOnce({ data: {} } as never)
      .mockRejectedValueOnce(new Error("season delete failed"));

    const { result } = renderHook(() => useDeleteSeason(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        episodes: [episode],
        onTaskStatusChange,
        season,
      }),
    ).rejects.toThrow("season delete failed");

    expect(onTaskStatusChange.mock.calls).toEqual([
      [`episode:${episode["@key"]}`, "running"],
      [`episode:${episode["@key"]}`, "completed"],
      [`season:${season["@key"]}`, "running"],
      [`season:${season["@key"]}`, "failed"],
    ]);
  });

  it("marks the current episode task as failed when an episode deletion fails", async () => {
    const season = makeSeason({ number: 4 });
    const episode = makeEpisode({
      episodeNumber: 7,
      season: { "@assetType": "seasons", "@key": season["@key"] },
      title: "Fault Line",
    });
    const onTaskStatusChange = vi.fn();
    vi.mocked(api.delete).mockRejectedValueOnce(new Error("episode delete failed"));

    const { result } = renderHook(() => useDeleteSeason(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        episodes: [episode],
        onTaskStatusChange,
        season,
      }),
    ).rejects.toThrow("episode delete failed");

    expect(onTaskStatusChange.mock.calls).toEqual([
      [`episode:${episode["@key"]}`, "running"],
      [`episode:${episode["@key"]}`, "failed"],
    ]);
  });
});
