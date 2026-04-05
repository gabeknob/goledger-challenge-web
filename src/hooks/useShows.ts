import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import {
  getEpisodesRootQueryKey,
  getSeasonsQueryKey,
  getShowDetailQueryKey,
} from "#/hooks/useShowDetail";
import { api } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import { getWatchlistQueryKey, watchlistsQueryKey } from "#/hooks/useWatchlists";
import type { Episode } from "#/types/episode";
import type { Season, TvShowReference } from "#/types/season";
import type { SearchResponse, TvShow } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

const SHOWS_BROWSE_PAGE_SIZE = 12;

interface ShowsBrowsePage {
  items: TvShow[];
  nextBookmark?: string;
}

interface TvShowPayload {
  title: string;
  description: string;
  recommendedAge: number;
}

interface UpdateShowPayload {
  current: TvShow;
  next: TvShowPayload;
}

interface SearchAssetPage<T> {
  items: T[];
  nextBookmark?: string;
}

interface CascadeDeleteResult {
  deletedEpisodes: number;
  deletedSeasons: number;
  updatedWatchlists: number;
}

export type ShowCascadeTaskStatus = "pending" | "running" | "completed" | "failed";

export interface ShowCascadeTask {
  id: string;
  kind: "watchlist" | "episode" | "season" | "show";
  label: string;
}

export interface ShowCascadePlan {
  tasks: ShowCascadeTask[];
  deletedEpisodes: number;
  deletedSeasons: number;
  updatedWatchlists: number;
}

interface CascadeDeleteShowPayload {
  onPlanChange?: (plan: ShowCascadePlan) => void;
  onTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
  show: TvShow;
}

export const showQueryKey = ["shows"] as const;
export const showsBrowseQueryKey = ["shows", "browse"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function searchAssetPage<T>({
  assetType,
  bookmark,
  limit,
  selector = {},
}: {
  assetType: string;
  bookmark?: string;
  limit: number;
  selector?: Record<string, unknown>;
}): Promise<SearchAssetPage<T>> {
  const { data } = await api.post<SearchResponse<T>>("/query/search", {
    query: {
      selector: {
        "@assetType": assetType,
        ...selector,
      },
      limit,
      ...(bookmark ? { bookmark } : {}),
    },
  });

  return {
    items: data.result,
    nextBookmark:
      data.result.length < limit || !data.metadata.bookmark ? undefined : data.metadata.bookmark,
  };
}

async function searchAllAssets<T>({
  assetType,
  limit = 200,
  selector = {},
}: {
  assetType: string;
  limit?: number;
  selector?: Record<string, unknown>;
}): Promise<T[]> {
  const items: T[] = [];
  let bookmark: string | undefined;

  do {
    const page = await searchAssetPage<T>({
      assetType,
      bookmark,
      limit,
      selector,
    });

    items.push(...page.items);
    bookmark = page.nextBookmark;
  } while (bookmark);

  return items;
}

async function fetchShows(): Promise<TvShow[]> {
  return searchAllAssets<TvShow>({
    assetType: "tvShows",
  });
}

async function fetchShowsBrowsePage({
  bookmark,
  search,
}: {
  bookmark?: string;
  search: string;
}): Promise<ShowsBrowsePage> {
  const normalizedSearch = search.trim();
  const selector = normalizedSearch
    ? {
        title: {
          $regex: `(?i)${escapeRegex(normalizedSearch)}`,
        },
      }
    : {};

  const page = await searchAssetPage<TvShow>({
    assetType: "tvShows",
    bookmark,
    limit: SHOWS_BROWSE_PAGE_SIZE,
    selector,
  });

  return {
    items: page.items,
    nextBookmark: page.nextBookmark,
  };
}

function buildShowAsset(payload: TvShowPayload) {
  return {
    "@assetType": "tvShows",
    title: payload.title,
    description: payload.description,
    recommendedAge: payload.recommendedAge,
  };
}

function buildWatchlistAsset(payload: {
  description: string;
  title: string;
  tvShows?: TvShowReference[];
}) {
  return {
    "@assetType": "watchlist",
    title: payload.title,
    description: payload.description,
    ...(payload.tvShows ? { tvShows: payload.tvShows } : {}),
  };
}

function buildSeasonKey(season: Pick<Season, "number" | "tvShow">) {
  return {
    "@assetType": "seasons",
    number: season.number,
    tvShow: season.tvShow,
  };
}

function buildEpisodeKey(episode: Pick<Episode, "season" | "episodeNumber">) {
  return {
    "@assetType": "episodes",
    season: episode.season,
    episodeNumber: episode.episodeNumber,
  };
}

async function createShow(payload: TvShowPayload) {
  await api.post("/invoke/createAsset", {
    asset: [buildShowAsset(payload)],
  });
}

async function updateShow({ current, next }: UpdateShowPayload) {
  const titleChanged = current.title !== next.title;

  if (titleChanged) {
    await createShow(next);

    await api.delete("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "tvShows",
          title: current.title,
        },
      },
    });

    return;
  }

  await api.put("/invoke/updateAsset", {
    update: buildShowAsset({
      title: current.title,
      description: next.description,
      recommendedAge: next.recommendedAge,
    }),
  });
}

async function deleteShow(show: TvShow) {
  await api.delete("/invoke/deleteAsset", {
    data: {
      key: {
        "@assetType": "tvShows",
        title: show.title,
      },
    },
  });
}

async function buildShowCascadePlan(show: TvShow): Promise<{
  plan: ShowCascadePlan;
  relatedEpisodes: Episode[];
  relatedSeasons: Season[];
  relatedWatchlists: Watchlist[];
}> {
  const [watchlists, seasons] = await Promise.all([
    searchAllAssets<Watchlist>({ assetType: "watchlist" }),
    searchAllAssets<Season>({ assetType: "seasons" }),
  ]);

  const relatedWatchlists = watchlists.filter(watchlist =>
    (watchlist.tvShows ?? []).some(reference => reference["@key"] === show["@key"]),
  );
  const relatedSeasons = seasons.filter(season => season.tvShow?.["@key"] === show["@key"]);
  const relatedSeasonKeys = new Set(relatedSeasons.map(season => season["@key"]));
  const relatedEpisodes =
    relatedSeasonKeys.size > 0
      ? (await searchAllAssets<Episode>({ assetType: "episodes", limit: 500 })).filter(episode =>
          relatedSeasonKeys.has(episode.season?.["@key"] ?? ""),
        )
      : [];

  const seasonNumberByKey = new Map(
    relatedSeasons.map(season => [season["@key"], season.number] as const),
  );
  const tasks: ShowCascadeTask[] = [
    ...relatedWatchlists.map(watchlist => ({
      id: `watchlist:${watchlist["@key"]}`,
      kind: "watchlist" as const,
      label: `Remove from watchlist "${watchlist.title}"`,
    })),
    ...relatedEpisodes.map(episode => ({
      id: `episode:${episode["@key"]}`,
      kind: "episode" as const,
      label: `Delete S${seasonNumberByKey.get(episode.season["@key"]) ?? "?"}E${episode.episodeNumber} · ${episode.title}`,
    })),
    ...relatedSeasons.map(season => ({
      id: `season:${season["@key"]}`,
      kind: "season" as const,
      label: `Delete Season ${season.number}`,
    })),
    {
      id: `show:${show["@key"]}`,
      kind: "show" as const,
      label: `Delete "${show.title}"`,
    },
  ];

  return {
    plan: {
      tasks,
      deletedEpisodes: relatedEpisodes.length,
      deletedSeasons: relatedSeasons.length,
      updatedWatchlists: relatedWatchlists.length,
    },
    relatedEpisodes,
    relatedSeasons,
    relatedWatchlists,
  };
}

async function cascadeDeleteShow({
  onPlanChange,
  onTaskStatusChange,
  show,
}: CascadeDeleteShowPayload): Promise<CascadeDeleteResult> {
  const { plan, relatedEpisodes, relatedSeasons, relatedWatchlists } =
    await buildShowCascadePlan(show);

  onPlanChange?.(plan);

  const runTask = async (taskId: string, action: () => Promise<void>) => {
    onTaskStatusChange?.(taskId, "running");
    try {
      await action();
      onTaskStatusChange?.(taskId, "completed");
    } catch (error) {
      onTaskStatusChange?.(taskId, "failed");
      throw error;
    }
  };

  for (const watchlist of relatedWatchlists) {
    await runTask(`watchlist:${watchlist["@key"]}`, () =>
      api.put("/invoke/updateAsset", {
        update: buildWatchlistAsset({
          title: watchlist.title,
          description: watchlist.description ?? "",
          tvShows: (watchlist.tvShows ?? []).filter(
            reference => reference["@key"] !== show["@key"],
          ),
        }),
      }),
    );
  }

  for (const episode of relatedEpisodes) {
    await runTask(`episode:${episode["@key"]}`, () =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildEpisodeKey(episode),
        },
      }),
    );
  }

  for (const season of relatedSeasons) {
    await runTask(`season:${season["@key"]}`, () =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildSeasonKey(season),
        },
      }),
    );
  }

  await runTask(`show:${show["@key"]}`, () => deleteShow(show));

  return {
    deletedEpisodes: relatedEpisodes.length,
    deletedSeasons: relatedSeasons.length,
    updatedWatchlists: relatedWatchlists.length,
  };
}

async function invalidateShowQueries(currentTitle?: string, nextTitle?: string) {
  await queryClient.invalidateQueries({ queryKey: showQueryKey });
  await queryClient.invalidateQueries({ queryKey: showsBrowseQueryKey });
  await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey });
  await queryClient.invalidateQueries({ queryKey: getEpisodesRootQueryKey() });
  await queryClient.invalidateQueries({ queryKey: ["episode"] });
  await queryClient.invalidateQueries({ queryKey: ["episodeHistory"] });

  if (currentTitle) {
    await queryClient.invalidateQueries({
      queryKey: getShowDetailQueryKey(currentTitle),
    });
  }

  if (nextTitle && nextTitle !== currentTitle) {
    await queryClient.invalidateQueries({
      queryKey: getShowDetailQueryKey(nextTitle),
    });
  }

  const watchlists = queryClient.getQueryData<Watchlist[]>(watchlistsQueryKey) ?? [];
  await Promise.all(
    watchlists.map(watchlist =>
      queryClient.invalidateQueries({
        queryKey: getWatchlistQueryKey(watchlist.title),
      }),
    ),
  );

  const showKey = queryClient
    .getQueriesData<TvShow>({
      queryKey: currentTitle ? getShowDetailQueryKey(currentTitle) : ["show"],
    })
    .find(([, data]) => Boolean(data))?.[1]?.["@key"];

  await queryClient.invalidateQueries({
    queryKey: getSeasonsQueryKey(showKey),
  });
}

export function useShows() {
  return useQuery({
    queryKey: showQueryKey,
    queryFn: fetchShows,
  });
}

export function useShowsBrowse(search: string) {
  return useInfiniteQuery({
    queryKey: [...showsBrowseQueryKey, search] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchShowsBrowsePage({
        bookmark: pageParam,
        search,
      }),
    getNextPageParam: lastPage => lastPage.nextBookmark,
  });
}

export function useCreateShow() {
  return useMutation({
    mutationFn: createShow,
    onSuccess: async () => {
      await invalidateShowQueries();
    },
  });
}

export function useUpdateShow() {
  return useMutation({
    mutationFn: updateShow,
    onSuccess: async (_, variables) => {
      await invalidateShowQueries(variables.current.title, variables.next.title);
    },
  });
}

export function useDeleteShow() {
  return useMutation({
    mutationFn: deleteShow,
    onSuccess: async (_, show) => {
      await invalidateShowQueries(show.title);
    },
  });
}

export function useCascadeDeleteShow() {
  return useMutation({
    mutationFn: cascadeDeleteShow,
    onSuccess: async (_, variables) => {
      await invalidateShowQueries(variables.show.title);
    },
  });
}
