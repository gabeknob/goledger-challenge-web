import { useMutation } from "@tanstack/react-query";

import { getEpisodesQueryKey, getSeasonsQueryKey } from "#/hooks/useShowDetail";
import { api } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import type { Episode } from "#/types/episode";
import type { Season, TvShowReference } from "#/types/season";

interface SeasonPayload {
  number: number;
  show: TvShowReference;
  year: number;
}

interface UpdateSeasonPayload {
  current: Season;
  next: {
    number: number;
    year: number;
  };
}

interface DeleteSeasonPayload {
  episodes: Episode[];
  season: Season;
}

function buildSeasonKey(season: Pick<Season, "number" | "tvShow">) {
  return {
    "@assetType": "seasons",
    number: season.number,
    tvShow: season.tvShow,
  };
}

function buildEpisodeKey(episode: Episode) {
  return {
    "@assetType": "episodes",
    episodeNumber: episode.episodeNumber,
    season: episode.season,
  };
}

async function createSeason(payload: SeasonPayload) {
  await api.post("/invoke/createAsset", {
    asset: [
      {
        "@assetType": "seasons",
        number: payload.number,
        tvShow: payload.show,
        year: payload.year,
      },
    ],
  });
}

async function updateSeason({ current, next }: UpdateSeasonPayload) {
  await api.put("/invoke/updateAsset", {
    update: {
      "@assetType": "seasons",
      number: current.number,
      tvShow: current.tvShow,
      year: next.year,
    },
  });
}

async function deleteSeason({ episodes, season }: DeleteSeasonPayload) {
  await Promise.all(
    episodes.map(episode =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildEpisodeKey(episode),
        },
      }),
    ),
  );

  await api.delete("/invoke/deleteAsset", {
    data: {
      key: buildSeasonKey(season),
    },
  });
}

export function useCreateSeason() {
  return useMutation({
    mutationFn: createSeason,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getSeasonsQueryKey(variables.show["@key"]),
      });
      await queryClient.invalidateQueries({
        queryKey: getEpisodesQueryKey([]).slice(0, 1),
      });
    },
  });
}

export function useUpdateSeason() {
  return useMutation({
    mutationFn: updateSeason,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getSeasonsQueryKey(variables.current.tvShow["@key"]),
      });
      await queryClient.invalidateQueries({
        queryKey: getEpisodesQueryKey([]).slice(0, 1),
      });
    },
  });
}

export function useDeleteSeason() {
  return useMutation({
    mutationFn: deleteSeason,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getSeasonsQueryKey(variables.season.tvShow["@key"]),
      });
      await queryClient.invalidateQueries({
        queryKey: getEpisodesQueryKey([]).slice(0, 1),
      });
    },
  });
}
