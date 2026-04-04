import { useQuery } from "@tanstack/react-query";

import { api } from "#/lib/api";
import type { Episode } from "#/types/episode";
import type { Season } from "#/types/season";
import type { SearchResponse, TvShow } from "#/types/tvShow";

export const getShowDetailQueryKey = (showTitle: string) => ["show", showTitle] as const;

async function fetchShow(showTitle: string): Promise<TvShow> {
  const { data } = await api.post<TvShow>("/query/readAsset", {
    key: {
      "@assetType": "tvShows",
      title: showTitle,
    },
  });

  return data;
}

async function fetchSeasons(showKey: string): Promise<Season[]> {
  const { data } = await api.post<SearchResponse<Season>>("/query/search", {
    query: {
      selector: {
        "@assetType": "seasons",
      },
      limit: 200,
    },
  });

  return data.result
    .filter(season => season.tvShow?.["@key"] === showKey)
    .sort((left, right) => left.number - right.number);
}

async function fetchEpisodes(seasonKeys: string[]): Promise<Episode[]> {
  if (seasonKeys.length === 0) {
    return [];
  }

  const { data } = await api.post<SearchResponse<Episode>>("/query/search", {
    query: {
      selector: {
        "@assetType": "episodes",
      },
      limit: 500,
    },
  });

  return data.result
    .filter(episode => seasonKeys.includes(episode.season?.["@key"] ?? ""))
    .sort((left, right) => left.episodeNumber - right.episodeNumber);
}

export function useShow(showTitle: string) {
  return useQuery({
    queryKey: getShowDetailQueryKey(showTitle),
    enabled: Boolean(showTitle),
    queryFn: () => fetchShow(showTitle),
  });
}

export function useSeasons(showKey?: string) {
  return useQuery({
    queryKey: ["seasons", showKey],
    enabled: Boolean(showKey),
    queryFn: () => fetchSeasons(showKey!),
  });
}

export function useEpisodes(seasonKeys: string[]) {
  return useQuery({
    queryKey: ["episodes", ...seasonKeys],
    enabled: seasonKeys.length > 0,
    queryFn: () => fetchEpisodes(seasonKeys),
  });
}
