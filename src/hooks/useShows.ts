import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import {
  getEpisodesRootQueryKey,
  getSeasonsQueryKey,
  getShowDetailQueryKey,
} from "#/hooks/useShowDetail";
import { api } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import { searchAllAssets, searchAssetPage } from "#/lib/search";
import {
  cascadeDeleteShow,
  renameShow,
  type ShowCascadePlan,
  type ShowCascadeTask,
  type ShowCascadeTaskStatus,
  type ShowRenamePlan,
} from "#/lib/showCascade";
import { getWatchlistQueryKey, watchlistsQueryKey } from "#/hooks/useWatchlists";
import type { TvShow } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

export type { ShowCascadeTask, ShowCascadeTaskStatus, ShowCascadePlan, ShowRenamePlan };

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
  onPlanChange?: (plan: ShowRenamePlan) => void;
  onTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
}

export const showQueryKey = ["shows"] as const;
export const showsBrowseQueryKey = ["shows", "browse"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildShowAsset(payload: TvShowPayload) {
  return {
    "@assetType": "tvShows",
    title: payload.title,
    description: payload.description,
    recommendedAge: payload.recommendedAge,
  };
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

async function createShow(payload: TvShowPayload) {
  await api.post("/invoke/createAsset", {
    asset: [buildShowAsset(payload)],
  });
}

async function updateShow({ current, next, onPlanChange, onTaskStatusChange }: UpdateShowPayload) {
  const titleChanged = current.title !== next.title;

  if (titleChanged) {
    await renameShow({ current, next, onPlanChange, onTaskStatusChange });
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
