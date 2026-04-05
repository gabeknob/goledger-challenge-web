import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  useCascadeDeleteShow,
  useCreateShow,
  useDeleteShow,
  useShows,
  useShowsBrowse,
  useUpdateShow,
} from "#/hooks/useShows";
import { queryClient } from "#/lib/queryClient";
import { api } from "#/lib/api";
import { makeEpisode, makeSeason, makeTvShow, makeWatchlist } from "#/test/factories";

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

describe("useShows", () => {
  afterEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it("fetches all shows across paginated search results", async () => {
    const firstPageShows = Array.from({ length: 200 }, (_, index) =>
      makeTvShow({
        "@key": `tvShows:first-${index}`,
        title: `First ${index + 1}`,
      }),
    );
    const secondPageShows = [
      makeTvShow({
        "@key": "tvShows:second-1",
        title: "Second 1",
      }),
    ];
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: "page-2" },
          result: firstPageShows,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: secondPageShows,
        },
      } as never);

    const { result } = renderHook(() => useShows(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([...firstPageShows, ...secondPageShows]);
    });

    expect(api.post).toHaveBeenNthCalledWith(1, "/query/search", {
      query: {
        selector: {
          "@assetType": "tvShows",
        },
        limit: 200,
      },
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/query/search", {
      query: {
        selector: {
          "@assetType": "tvShows",
        },
        limit: 200,
        bookmark: "page-2",
      },
    });
  });

  it("browses shows with a server regex selector and paginates with bookmarks", async () => {
    const firstPageShows = Array.from({ length: 12 }, (_, index) =>
      makeTvShow({
        "@key": `tvShows:browse-${index}`,
        title: `Ted ${index + 1}`,
      }),
    );
    const secondPageShows = [
      makeTvShow({
        "@key": "tvShows:browse-13",
        title: "Ted 13",
      }),
    ];
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: "page-2" },
          result: firstPageShows,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: "page-3" },
          result: secondPageShows,
        },
      } as never);

    const { result } = renderHook(() => useShowsBrowse(" Ted? "), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.pages[0].items).toEqual(firstPageShows);
      expect(result.current.hasNextPage).toBe(true);
    });

    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages[1].items).toEqual(secondPageShows);
      expect(result.current.hasNextPage).toBe(false);
    });

    expect(api.post).toHaveBeenNthCalledWith(1, "/query/search", {
      query: {
        selector: {
          "@assetType": "tvShows",
          title: {
            $regex: "(?i)Ted\\?",
          },
        },
        limit: 12,
      },
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/query/search", {
      query: {
        selector: {
          "@assetType": "tvShows",
          title: {
            $regex: "(?i)Ted\\?",
          },
        },
        limit: 12,
        bookmark: "page-2",
      },
    });
  });

  it("browses shows without a title selector when the search term is blank", async () => {
    const shows = [makeTvShow({ title: "Ted Lasso" })];
    vi.mocked(api.post).mockResolvedValue({
      data: {
        metadata: { bookmark: undefined },
        result: shows,
      },
    } as never);

    const { result } = renderHook(() => useShowsBrowse("   "), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.pages[0].items).toEqual(shows);
      expect(result.current.hasNextPage).toBe(false);
    });

    expect(api.post).toHaveBeenCalledWith("/query/search", {
      query: {
        selector: {
          "@assetType": "tvShows",
        },
        limit: 12,
      },
    });
  });

  it("creates a show and invalidates the shared show queries", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue([]);
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([]);

    const { result } = renderHook(() => useCreateShow(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      description: "AFC Richmond returns",
      recommendedAge: 14,
      title: "Ted Lasso",
    });

    expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
      asset: [
        {
          "@assetType": "tvShows",
          title: "Ted Lasso",
          description: "AFC Richmond returns",
          recommendedAge: 14,
        },
      ],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["shows"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["shows", "browse"],
    });
  });

  it("renames a show by migrating dependent records and invalidates old and new show detail queries", async () => {
    const current = makeTvShow({
      "@key": "tvShows:ted-lasso",
      description: "Old description",
      title: "Ted Lasso",
    });
    const renamedShow = makeTvShow({
      "@key": "tvShows:ted-lasso-reloaded",
      title: "Ted Lasso Reloaded",
      description: "Fresh description",
      recommendedAge: 16,
    });
    const season = makeSeason({
      "@key": "seasons:ted-lasso-1",
      number: 1,
      tvShow: {
        "@assetType": "tvShows",
        "@key": current["@key"],
      },
    });
    const recreatedSeason = makeSeason({
      "@key": "seasons:ted-lasso-reloaded-1",
      number: 1,
      tvShow: {
        "@assetType": "tvShows",
        "@key": renamedShow["@key"],
      },
    });
    const episode = makeEpisode({
      "@key": "episodes:ted-lasso-1-1",
      episodeNumber: 1,
      season: {
        "@assetType": "seasons",
        "@key": season["@key"],
      },
      title: "Pilot",
    });
    const watchlist = makeWatchlist({
      title: "Favorites",
      tvShows: [
        {
          "@assetType": "tvShows",
          "@key": current["@key"],
        },
      ],
    });

    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [watchlist],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [season],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [episode],
        },
      } as never)
      .mockResolvedValueOnce({ data: {} } as never)
      .mockResolvedValueOnce({ data: renamedShow } as never)
      .mockResolvedValueOnce({ data: {} } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [recreatedSeason],
        },
      } as never)
      .mockResolvedValueOnce({ data: {} } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue([watchlist]);
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([
      [["show", current.title], current],
    ] as never);

    const { result } = renderHook(() => useUpdateShow(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current,
      next: {
        description: "Fresh description",
        recommendedAge: 16,
        title: "Ted Lasso Reloaded",
      },
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/query/readAsset", {
        key: {
          "@assetType": "tvShows",
          title: "Ted Lasso Reloaded",
        },
      });
      expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
        asset: [
          {
            "@assetType": "tvShows",
            title: "Ted Lasso Reloaded",
            description: "Fresh description",
            recommendedAge: 16,
          },
        ],
      });
    });

    expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
      asset: [
        {
          "@assetType": "seasons",
          number: season.number,
          tvShow: {
            "@assetType": "tvShows",
            "@key": renamedShow["@key"],
          },
          year: season.year,
        },
      ],
    });
    expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
      asset: [
        {
          "@assetType": "episodes",
          season: {
            "@assetType": "seasons",
            "@key": recreatedSeason["@key"],
          },
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          releaseDate: episode.releaseDate,
          description: episode.description,
          rating: episode.rating,
        },
      ],
    });
    expect(api.put).toHaveBeenCalledWith("/invoke/updateAsset", {
      update: {
        "@assetType": "watchlist",
        title: watchlist.title,
        description: watchlist.description ?? "",
        tvShows: [
          {
            "@assetType": "tvShows",
            "@key": renamedShow["@key"],
          },
        ],
      },
    });
    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "tvShows",
          title: "Ted Lasso",
        },
      },
    });
    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "episodes",
          season: episode.season,
          episodeNumber: episode.episodeNumber,
        },
      },
    });
    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
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
        queryKey: ["show", "Ted Lasso"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["show", "Ted Lasso Reloaded"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists", "Favorites"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["shows", "browse"],
      });
    });
  });

  it("updates a show in place when the title stays the same", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue([]);
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([]);

    const current = makeTvShow({
      description: "Old description",
      title: "Ted Lasso",
    });

    const { result } = renderHook(() => useUpdateShow(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      current,
      next: {
        description: "Updated description",
        recommendedAge: 16,
        title: "Ted Lasso",
      },
    });

    expect(api.put).toHaveBeenCalledWith("/invoke/updateAsset", {
      update: {
        "@assetType": "tvShows",
        title: "Ted Lasso",
        description: "Updated description",
        recommendedAge: 16,
      },
    });
    expect(api.post).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["show", "Ted Lasso"],
    });
  });

  it("deletes a show directly and invalidates the related queries", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue([]);
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([]);
    const show = makeTvShow({ title: "Ted Lasso" });

    const { result } = renderHook(() => useDeleteShow(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(show);

    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "tvShows",
          title: "Ted Lasso",
        },
      },
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["show", "Ted Lasso"],
    });
  });

  it("builds a cascade plan, runs dependent deletions in order, and invalidates related queries", async () => {
    const show = makeTvShow({
      "@key": "tvShows:ted-lasso",
      title: "Ted Lasso",
    });
    const season = makeSeason({
      "@key": "seasons:ted-lasso-1",
      number: 1,
      tvShow: {
        "@assetType": "tvShows",
        "@key": show["@key"],
      },
    });
    const episode = makeEpisode({
      "@key": "episodes:ted-lasso-1-1",
      episodeNumber: 1,
      season: {
        "@assetType": "seasons",
        "@key": season["@key"],
      },
      title: "Pilot",
    });
    const relatedWatchlist = makeWatchlist({
      title: "Favorites",
      tvShows: [
        {
          "@assetType": "tvShows",
          "@key": show["@key"],
        },
      ],
    });
    const unrelatedWatchlist = makeWatchlist({
      title: "Sci-Fi",
      tvShows: [
        {
          "@assetType": "tvShows",
          "@key": "tvShows:foundation",
        },
      ],
    });

    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [relatedWatchlist, unrelatedWatchlist],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [season],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [episode],
        },
      } as never);
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    vi.spyOn(queryClient, "getQueryData").mockReturnValue([relatedWatchlist]);
    vi.spyOn(queryClient, "getQueriesData").mockReturnValue([
      [["show", show.title], show],
    ] as never);

    const onPlanChange = vi.fn();
    const onTaskStatusChange = vi.fn();

    const { result } = renderHook(() => useCascadeDeleteShow(), {
      wrapper: createWrapper(),
    });

    const cascadeResult = await result.current.mutateAsync({
      onPlanChange,
      onTaskStatusChange,
      show,
    });

    expect(cascadeResult).toEqual({
      deletedEpisodes: 1,
      deletedSeasons: 1,
      updatedWatchlists: 1,
    });

    expect(onPlanChange).toHaveBeenCalledWith({
      deletedEpisodes: 1,
      deletedSeasons: 1,
      tasks: [
        {
          id: `watchlist:${relatedWatchlist["@key"]}`,
          kind: "watchlist",
          label: 'Remove from watchlist "Favorites"',
        },
        {
          id: `episode:${episode["@key"]}`,
          kind: "episode",
          label: "Delete S1E1 · Pilot",
        },
        {
          id: `season:${season["@key"]}`,
          kind: "season",
          label: "Delete Season 1",
        },
        {
          id: `show:${show["@key"]}`,
          kind: "show",
          label: 'Delete "Ted Lasso"',
        },
      ],
      updatedWatchlists: 1,
    });

    expect(onTaskStatusChange.mock.calls).toEqual([
      [`watchlist:${relatedWatchlist["@key"]}`, "running"],
      [`watchlist:${relatedWatchlist["@key"]}`, "completed"],
      [`episode:${episode["@key"]}`, "running"],
      [`episode:${episode["@key"]}`, "completed"],
      [`season:${season["@key"]}`, "running"],
      [`season:${season["@key"]}`, "completed"],
      [`show:${show["@key"]}`, "running"],
      [`show:${show["@key"]}`, "completed"],
    ]);

    expect(api.put).toHaveBeenCalledWith("/invoke/updateAsset", {
      update: {
        "@assetType": "watchlist",
        title: "Favorites",
        description: relatedWatchlist.description,
        tvShows: [],
      },
    });
    expect(api.delete).toHaveBeenNthCalledWith(1, "/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "episodes",
          season: episode.season,
          episodeNumber: episode.episodeNumber,
        },
      },
    });
    expect(api.delete).toHaveBeenNthCalledWith(2, "/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "seasons",
          number: season.number,
          tvShow: season.tvShow,
        },
      },
    });
    expect(api.delete).toHaveBeenNthCalledWith(3, "/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "tvShows",
          title: show.title,
        },
      },
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists", "Favorites"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["seasons", show["@key"]],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["show", show.title],
      });
    });
  });

  it("marks the current cascade task as failed when a dependent mutation throws", async () => {
    const show = makeTvShow({
      "@key": "tvShows:ted-lasso",
      title: "Ted Lasso",
    });
    const relatedWatchlist = makeWatchlist({
      title: "Favorites",
      tvShows: [
        {
          "@assetType": "tvShows",
          "@key": show["@key"],
        },
      ],
    });
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [relatedWatchlist],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          metadata: { bookmark: undefined },
          result: [],
        },
      } as never);
    vi.mocked(api.put).mockRejectedValueOnce(new Error("watchlist update failed"));

    const onTaskStatusChange = vi.fn();

    const { result } = renderHook(() => useCascadeDeleteShow(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        onTaskStatusChange,
        show,
      }),
    ).rejects.toThrow("watchlist update failed");

    expect(onTaskStatusChange.mock.calls).toEqual([
      [`watchlist:${relatedWatchlist["@key"]}`, "running"],
      [`watchlist:${relatedWatchlist["@key"]}`, "failed"],
    ]);
  });
});
