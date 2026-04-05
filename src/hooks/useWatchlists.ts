import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import type { TvShowReference } from "#/types/season";
import type { SearchResponse } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

interface WatchlistPayload {
  description: string;
  title: string;
  tvShows?: Watchlist["tvShows"];
}

interface UpdateWatchlistPayload {
  current: Watchlist;
  next: {
    description: string;
    title: string;
    tvShows?: TvShowReference[];
  };
}

export const watchlistsQueryKey = ["watchlists"] as const;
export const getWatchlistQueryKey = (title: string) => ["watchlists", title] as const;

async function fetchWatchlists(): Promise<Watchlist[]> {
  const { data } = await api.post<SearchResponse<Watchlist>>("/query/search", {
    query: {
      selector: {
        "@assetType": "watchlist",
      },
    },
  });

  return data.result.sort((left, right) => left.title.localeCompare(right.title));
}

async function fetchWatchlist(title: string): Promise<Watchlist> {
  const { data } = await api.post<Watchlist>("/query/readAsset", {
    key: {
      "@assetType": "watchlist",
      title,
    },
  });

  return data;
}

function buildWatchlistAsset(payload: WatchlistPayload) {
  return {
    "@assetType": "watchlist",
    title: payload.title,
    description: payload.description,
    ...(payload.tvShows ? { tvShows: payload.tvShows } : {}),
  };
}

async function createWatchlist(payload: WatchlistPayload) {
  await api.post("/invoke/createAsset", {
    asset: [buildWatchlistAsset(payload)],
  });
}

async function updateWatchlist({ current, next }: UpdateWatchlistPayload) {
  const titleChanged = current.title !== next.title;

  if (titleChanged) {
    await createWatchlist({
      description: next.description,
      title: next.title,
      tvShows: next.tvShows ?? current.tvShows,
    });

    await api.delete("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "watchlist",
          title: current.title,
        },
      },
    });

    return;
  }

  await api.put("/invoke/updateAsset", {
    update: buildWatchlistAsset({
      description: next.description,
      title: current.title,
      tvShows: next.tvShows ?? current.tvShows,
    }),
  });
}

async function deleteWatchlist(watchlist: Watchlist) {
  await api.delete("/invoke/deleteAsset", {
    data: {
      key: {
        "@assetType": "watchlist",
        title: watchlist.title,
      },
    },
  });
}

export function useWatchlists() {
  return useQuery({
    queryKey: watchlistsQueryKey,
    queryFn: fetchWatchlists,
  });
}

export function useWatchlist(title: string) {
  return useQuery({
    queryKey: getWatchlistQueryKey(title),
    enabled: Boolean(title),
    queryFn: () => fetchWatchlist(title),
  });
}

export function useCreateWatchlist() {
  return useMutation({
    mutationFn: createWatchlist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey });
    },
  });
}

export function useUpdateWatchlist() {
  return useMutation({
    mutationFn: updateWatchlist,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: getWatchlistQueryKey(variables.current.title),
      });

      const nextTitle = variables.next.title;
      if (nextTitle && nextTitle !== variables.current.title) {
        await queryClient.invalidateQueries({
          queryKey: getWatchlistQueryKey(nextTitle),
        });
      }
    },
  });
}

export function useDeleteWatchlist() {
  return useMutation({
    mutationFn: deleteWatchlist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: watchlistsQueryKey });
    },
  });
}
