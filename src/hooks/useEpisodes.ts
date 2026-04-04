import { useMutation } from "@tanstack/react-query";

import { getEpisodesRootQueryKey } from "#/hooks/useShowDetail";
import { api } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import type { Episode } from "#/types/episode";
import type { SeasonReference } from "#/types/season";

interface EpisodePayload {
  season: SeasonReference;
  episodeNumber: number;
  title: string;
  releaseDate: string;
  description: string;
  rating?: number;
}

interface UpdateEpisodePayload {
  current: Episode;
  next: {
    episodeNumber: number;
    title: string;
    releaseDate: string;
    description: string;
    rating?: number;
  };
}

function buildEpisodeAsset(payload: EpisodePayload) {
  return {
    "@assetType": "episodes",
    season: payload.season,
    episodeNumber: payload.episodeNumber,
    title: payload.title,
    releaseDate: payload.releaseDate,
    description: payload.description,
    ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
  };
}

function buildEpisodeKey(episode: Pick<Episode, "season" | "episodeNumber">) {
  return {
    "@assetType": "episodes",
    season: episode.season,
    episodeNumber: episode.episodeNumber,
  };
}

async function createEpisode(payload: EpisodePayload) {
  await api.post("/invoke/createAsset", {
    asset: [buildEpisodeAsset(payload)],
  });
}

async function updateEpisode({ current, next }: UpdateEpisodePayload) {
  const episodeNumberChanged = current.episodeNumber !== next.episodeNumber;

  if (episodeNumberChanged) {
    await createEpisode({
      season: current.season,
      episodeNumber: next.episodeNumber,
      title: next.title,
      releaseDate: next.releaseDate,
      description: next.description,
      rating: next.rating,
    });

    await api.delete("/invoke/deleteAsset", {
      data: {
        key: buildEpisodeKey(current),
      },
    });

    return;
  }

  await api.put("/invoke/updateAsset", {
    update: buildEpisodeAsset({
      season: current.season,
      episodeNumber: current.episodeNumber,
      title: next.title,
      releaseDate: next.releaseDate,
      description: next.description,
      rating: next.rating,
    }),
  });
}

async function deleteEpisode(episode: Episode) {
  await api.delete("/invoke/deleteAsset", {
    data: {
      key: buildEpisodeKey(episode),
    },
  });
}

async function invalidateEpisodeQueries() {
  await queryClient.invalidateQueries({
    queryKey: getEpisodesRootQueryKey(),
  });
}

export function useCreateEpisode() {
  return useMutation({
    mutationFn: createEpisode,
    onSuccess: invalidateEpisodeQueries,
  });
}

export function useUpdateEpisode() {
  return useMutation({
    mutationFn: updateEpisode,
    onSuccess: invalidateEpisodeQueries,
  });
}

export function useDeleteEpisode() {
  return useMutation({
    mutationFn: deleteEpisode,
    onSuccess: invalidateEpisodeQueries,
  });
}
