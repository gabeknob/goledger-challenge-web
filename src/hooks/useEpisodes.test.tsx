import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { useCreateEpisode, useDeleteEpisode, useUpdateEpisode } from "#/hooks/useEpisodes";
import { queryClient } from "#/lib/queryClient";
import { api } from "#/lib/api";
import { makeEpisode } from "#/test/factories";

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

describe("useEpisodes", () => {
  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("creates an episode and invalidates the episodes root query", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const episode = makeEpisode({
      episodeNumber: 3,
      title: "Tan Lines",
    });

    const { result } = renderHook(() => useCreateEpisode(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      season: episode.season,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      releaseDate: episode.releaseDate,
      description: episode.description,
      rating: episode.rating,
    });

    expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
      asset: [
        {
          "@assetType": "episodes",
          season: episode.season,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          releaseDate: episode.releaseDate,
          description: episode.description,
          rating: episode.rating,
        },
      ],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["episodes"],
    });
  });

  it("creates an episode without sending a rating when it is omitted", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const episode = makeEpisode({
      episodeNumber: 5,
      rating: undefined,
      title: "Rainbow",
    });

    const { result } = renderHook(() => useCreateEpisode(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      season: episode.season,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      releaseDate: episode.releaseDate,
      description: episode.description,
    });

    expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
      asset: [
        {
          "@assetType": "episodes",
          season: episode.season,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          releaseDate: episode.releaseDate,
          description: episode.description,
        },
      ],
    });
  });

  it("renumbers an episode through create-and-delete and invalidates detail queries", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const current = makeEpisode({
      episodeNumber: 1,
      title: "Pilot",
    });

    const { result } = renderHook(() => useUpdateEpisode(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current,
      next: {
        description: "A new beginning.",
        episodeNumber: 2,
        rating: 9.1,
        releaseDate: "2020-08-21T00:00:00.000Z",
        title: "Bis",
      },
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
        asset: [
          {
            "@assetType": "episodes",
            season: current.season,
            episodeNumber: 2,
            title: "Bis",
            releaseDate: "2020-08-21T00:00:00.000Z",
            description: "A new beginning.",
            rating: 9.1,
          },
        ],
      });
    });

    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "episodes",
          season: current.season,
          episodeNumber: current.episodeNumber,
        },
      },
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["episodes"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["episode"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["episodeHistory"],
      });
    });
  });

  it("updates an episode in place when the episode number stays the same", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const current = makeEpisode({
      episodeNumber: 4,
      title: "Sunflowers",
    });

    const { result } = renderHook(() => useUpdateEpisode(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      current,
      next: {
        description: "A calmer chapter.",
        episodeNumber: current.episodeNumber,
        rating: 8.7,
        releaseDate: "2020-09-04T00:00:00.000Z",
        title: "Sunflowers Revisited",
      },
    });

    expect(api.put).toHaveBeenCalledWith("/invoke/updateAsset", {
      update: {
        "@assetType": "episodes",
        season: current.season,
        episodeNumber: current.episodeNumber,
        title: "Sunflowers Revisited",
        releaseDate: "2020-09-04T00:00:00.000Z",
        description: "A calmer chapter.",
        rating: 8.7,
      },
    });
    expect(api.post).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["episodes"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["episode"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["episodeHistory"],
    });
  });

  it("deletes an episode and invalidates the episodes root query", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const episode = makeEpisode({
      episodeNumber: 4,
      title: "Sunflowers",
    });

    const { result } = renderHook(() => useDeleteEpisode(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(episode);

    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "episodes",
          season: episode.season,
          episodeNumber: episode.episodeNumber,
        },
      },
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["episodes"],
    });
  });
});
