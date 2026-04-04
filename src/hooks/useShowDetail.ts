import { useQuery } from "@tanstack/react-query";

import { api } from "#/lib/api";
import type { Episode, EpisodeHistoryEntry } from "#/types/episode";
import type { Season } from "#/types/season";
import type { SearchResponse, TvShow } from "#/types/tvShow";

export const getShowDetailQueryKey = (showTitle: string) => ["show", showTitle] as const;
export const getSeasonsQueryKey = (showKey?: string) => ["seasons", showKey] as const;
export const getEpisodesRootQueryKey = () => ["episodes"] as const;
export const getEpisodesQueryKey = (seasonKeys: string[]) => ["episodes", ...seasonKeys] as const;
export const getEpisodeQueryKey = (
  showKey?: string,
  seasonNumber?: number,
  episodeNumber?: number,
) => ["episode", showKey, seasonNumber, episodeNumber] as const;
export const getEpisodeHistoryQueryKey = (episodeKey?: string) =>
  ["episodeHistory", episodeKey] as const;

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

async function fetchEpisode(
  showKey: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<Episode> {
  const seasons = await fetchSeasons(showKey);
  const season = seasons.find(entry => entry.number === seasonNumber);

  if (!season) {
    throw new Error(`Season ${seasonNumber} was not found for this show.`);
  }

  const episodes = await fetchEpisodes([season["@key"]]);
  const episode = episodes.find(entry => entry.episodeNumber === episodeNumber);

  if (!episode) {
    throw new Error(`Episode ${episodeNumber} was not found in Season ${seasonNumber}.`);
  }

  return episode;
}

async function fetchEpisodeHistory(episode: Episode): Promise<EpisodeHistoryEntry[]> {
  const { data } = await api.post<EpisodeHistoryEntry[]>("/query/readAssetHistory", {
    key: {
      "@assetType": "episodes",
      season: episode.season,
      episodeNumber: episode.episodeNumber,
    },
  });

  return [...data].sort((left, right) => {
    return new Date(right._timestamp).getTime() - new Date(left._timestamp).getTime();
  });
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
    queryKey: getSeasonsQueryKey(showKey),
    enabled: Boolean(showKey),
    queryFn: () => fetchSeasons(showKey!),
  });
}

export function useEpisodes(seasonKeys: string[]) {
  return useQuery({
    queryKey: getEpisodesQueryKey(seasonKeys),
    enabled: seasonKeys.length > 0,
    queryFn: () => fetchEpisodes(seasonKeys),
  });
}

export function useEpisode(showKey?: string, seasonNumber?: number, episodeNumber?: number) {
  return useQuery({
    queryKey: getEpisodeQueryKey(showKey, seasonNumber, episodeNumber),
    enabled:
      Boolean(showKey) &&
      seasonNumber !== undefined &&
      !Number.isNaN(seasonNumber) &&
      episodeNumber !== undefined &&
      !Number.isNaN(episodeNumber),
    queryFn: () => fetchEpisode(showKey!, seasonNumber!, episodeNumber!),
  });
}

export function useEpisodeHistory(episode?: Episode | null) {
  return useQuery({
    queryKey: getEpisodeHistoryQueryKey(episode?.["@key"]),
    enabled: Boolean(episode),
    queryFn: () => fetchEpisodeHistory(episode!),
  });
}
