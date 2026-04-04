import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import type { SearchResponse, TvShow } from "#/types/tvShow";

async function fetchShows(): Promise<TvShow[]> {
  const { data } = await api.post<SearchResponse<TvShow>>("/query/search", {
    query: {
      selector: {
        "@assetType": "tvShows",
      },
    },
  });
  return data.result;
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

export const showQueryKey = ["shows"] as const;

async function createShow(payload: TvShowPayload) {
  await api.post("/invoke/createAsset", {
    asset: [
      {
        "@assetType": "tvShows",
        title: payload.title,
        description: payload.description,
        recommendedAge: payload.recommendedAge,
      },
    ],
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
    update: {
      "@assetType": "tvShows",
      title: current.title,
      description: next.description,
      recommendedAge: next.recommendedAge,
    },
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

export function useShows() {
  return useQuery({
    queryKey: showQueryKey,
    queryFn: fetchShows,
  });
}

export function useCreateShow() {
  return useMutation({
    mutationFn: createShow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: showQueryKey });
    },
  });
}

export function useUpdateShow() {
  return useMutation({
    mutationFn: updateShow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: showQueryKey });
    },
  });
}

export function useDeleteShow() {
  return useMutation({
    mutationFn: deleteShow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: showQueryKey });
    },
  });
}
