import { useQuery } from "@tanstack/react-query";

import { tmdbApi } from "#/lib/tmdb";
import {
  tmdbEpisodeDetailsSchema,
  tmdbEpisodeImagesResponseSchema,
  tmdbSearchResponseSchema,
} from "#/schemas/tmdb";
import { useTMDBStore } from "#/stores/tmdb";
import { getEnv } from "#/lib/env";

type TMDBImageKind = "poster" | "still";
type TMDBEpisodeStillInput = {
  episodeNumber: number;
  fallbackEpisodeNumber?: number;
  seasonNumber: number;
  showTitle: string;
};

function buildImageUrl(path: string | null | undefined) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

function buildEpisodeStillCacheKey({
  episodeNumber,
  fallbackEpisodeNumber,
  seasonNumber,
  showTitle,
}: TMDBEpisodeStillInput) {
  const fallbackSuffix =
    fallbackEpisodeNumber && fallbackEpisodeNumber !== episodeNumber
      ? `::f${fallbackEpisodeNumber}`
      : "";

  return `${showTitle.trim()}::s${seasonNumber}e${episodeNumber}${fallbackSuffix}`;
}

async function fetchTMDBImage(title: string, kind: TMDBImageKind) {
  if (!getEnv("VITE_TMDB_API_KEY").trim() || !title.trim()) {
    return null;
  }

  const response = await tmdbApi.get("/search/tv", {
    params: {
      query: title,
    },
  });
  const data = tmdbSearchResponseSchema.parse(response.data);
  const firstResult = data.results[0];
  const imagePath = kind === "poster" ? firstResult?.poster_path : firstResult?.backdrop_path;

  return buildImageUrl(imagePath);
}

async function fetchTMDBSeriesId(showTitle: string) {
  if (!getEnv("VITE_TMDB_API_KEY").trim() || !showTitle.trim()) {
    return null;
  }

  const response = await tmdbApi.get("/search/tv", {
    params: {
      query: showTitle,
    },
  });
  const data = tmdbSearchResponseSchema.parse(response.data);
  const normalizedShowTitle = normalizeTitle(showTitle);
  const exactMatch =
    data.results.find(result => normalizeTitle(result.name ?? "") === normalizedShowTitle) ??
    data.results.find(result => normalizeTitle(result.original_name ?? "") === normalizedShowTitle);

  return (exactMatch ?? data.results[0])?.id ?? null;
}

async function fetchTMDBEpisodeStill(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
  fallbackEpisodeNumber?: number,
) {
  const candidates = [
    {
      episodeNumber,
      seasonNumber,
    },
    ...(fallbackEpisodeNumber && fallbackEpisodeNumber !== episodeNumber
      ? [
          {
            episodeNumber: fallbackEpisodeNumber,
            seasonNumber: 1,
          },
        ]
      : []),
  ];

  for (const candidate of candidates) {
    try {
      const detailsResponse = await tmdbApi.get(
        `/tv/${seriesId}/season/${candidate.seasonNumber}/episode/${candidate.episodeNumber}`,
      );
      const details = tmdbEpisodeDetailsSchema.parse(detailsResponse.data);
      const detailsImage = buildImageUrl(details.still_path);

      if (detailsImage) {
        return detailsImage;
      }

      const imagesResponse = await tmdbApi.get(
        `/tv/${seriesId}/season/${candidate.seasonNumber}/episode/${candidate.episodeNumber}/images`,
      );
      const images = tmdbEpisodeImagesResponseSchema.parse(imagesResponse.data);
      const fallbackImage = buildImageUrl(images.stills[0]?.file_path);

      if (fallbackImage) {
        return fallbackImage;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function useTMDB(title: string, kind: TMDBImageKind = "poster") {
  const cachedImage = useTMDBStore(state => state.getImage(kind, title));
  const setImage = useTMDBStore(state => state.setImage);
  const hasCacheEntry = cachedImage !== undefined;

  const query = useQuery({
    queryKey: ["tmdb", kind, title],
    enabled: Boolean(title.trim()) && !hasCacheEntry,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const imageUrl = await fetchTMDBImage(title, kind);
      setImage(kind, title, imageUrl);
      return imageUrl;
    },
  });

  return {
    imageUrl: hasCacheEntry ? (cachedImage ?? null) : (query.data ?? null),
    isLoading: !hasCacheEntry && query.isLoading,
    isError: !hasCacheEntry && query.isError,
    isFromCache: hasCacheEntry,
  };
}

function useTMDBSeriesId(showTitle: string) {
  const cachedSeriesId = useTMDBStore(state => state.getSeriesId(showTitle));
  const setSeriesId = useTMDBStore(state => state.setSeriesId);
  const hasCacheEntry = cachedSeriesId !== undefined;

  const query = useQuery({
    queryKey: ["tmdb", "series", showTitle],
    enabled: Boolean(showTitle.trim()) && !hasCacheEntry,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const seriesId = await fetchTMDBSeriesId(showTitle);
      setSeriesId(showTitle, seriesId);
      return seriesId;
    },
  });

  return {
    seriesId: hasCacheEntry ? (cachedSeriesId ?? null) : (query.data ?? null),
    isError: !hasCacheEntry && query.isError,
    isLoading: !hasCacheEntry && query.isLoading,
  };
}

export function useTMDBEpisodeStill({
  episodeNumber,
  fallbackEpisodeNumber,
  seasonNumber,
  showTitle,
}: TMDBEpisodeStillInput) {
  const cacheKey = buildEpisodeStillCacheKey({
    episodeNumber,
    fallbackEpisodeNumber,
    seasonNumber,
    showTitle,
  });
  const cachedImage = useTMDBStore(state => state.getImage("still", cacheKey));
  const setImage = useTMDBStore(state => state.setImage);
  const hasCacheEntry = cachedImage !== undefined;
  const {
    isError: isSeriesError,
    isLoading: isSeriesLoading,
    seriesId,
  } = useTMDBSeriesId(showTitle);

  const query = useQuery({
    queryKey: ["tmdb", "still", seriesId, seasonNumber, episodeNumber, fallbackEpisodeNumber],
    enabled:
      Boolean(seriesId) &&
      seasonNumber > 0 &&
      episodeNumber > 0 &&
      !hasCacheEntry &&
      Boolean(showTitle.trim()),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const imageUrl = await fetchTMDBEpisodeStill(
        seriesId!,
        seasonNumber,
        episodeNumber,
        fallbackEpisodeNumber,
      );
      setImage("still", cacheKey, imageUrl);
      return imageUrl;
    },
  });

  return {
    imageUrl: hasCacheEntry ? (cachedImage ?? null) : (query.data ?? null),
    isError: !hasCacheEntry && (isSeriesError || query.isError),
    isLoading: !hasCacheEntry && (isSeriesLoading || query.isLoading),
    isFromCache: hasCacheEntry,
  };
}
