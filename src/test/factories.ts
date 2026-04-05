import type { Episode } from "#/types/episode";
import type { Season } from "#/types/season";
import type { TvShow } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

function buildKey(assetType: string, identifier: string) {
  return `${assetType}:${identifier}`;
}

export function makeTvShow(overrides: Partial<TvShow> = {}): TvShow {
  const title = overrides.title ?? "Ted Lasso";

  return {
    "@assetType": "tvShows",
    "@key": overrides["@key"] ?? buildKey("tvShows", title),
    title,
    description: overrides.description ?? "A hopeful football coach takes on a new challenge.",
    recommendedAge: overrides.recommendedAge ?? 14,
    ...overrides,
  };
}

export function makeSeason(overrides: Partial<Season> = {}): Season {
  const number = overrides.number ?? 1;
  const tvShow = overrides.tvShow ?? {
    "@assetType": "tvShows",
    "@key": buildKey("tvShows", "Ted Lasso"),
  };

  return {
    "@assetType": "seasons",
    "@key": overrides["@key"] ?? buildKey("seasons", `${tvShow["@key"]}:${number}`),
    number,
    tvShow,
    year: overrides.year ?? 2020,
    ...overrides,
  };
}

export function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  const season = overrides.season ?? {
    "@assetType": "seasons",
    "@key": buildKey("seasons", "Ted Lasso:1"),
  };
  const episodeNumber = overrides.episodeNumber ?? 1;

  return {
    "@assetType": "episodes",
    "@key": overrides["@key"] ?? buildKey("episodes", `${season["@key"]}:${episodeNumber}`),
    season,
    episodeNumber,
    title: overrides.title ?? "Pilot",
    releaseDate: overrides.releaseDate ?? "2020-08-14",
    description: overrides.description ?? "The first episode.",
    ...(overrides.rating !== undefined ? { rating: overrides.rating } : { rating: 8.5 }),
    ...overrides,
  };
}

export function makeWatchlist(overrides: Partial<Watchlist> = {}): Watchlist {
  const title = overrides.title ?? "Weekend Picks";

  return {
    "@assetType": "watchlist",
    "@key": overrides["@key"] ?? buildKey("watchlist", title),
    title,
    description: overrides.description ?? "Shows to keep for the weekend.",
    tvShows: overrides.tvShows ?? [],
    ...overrides,
  };
}
