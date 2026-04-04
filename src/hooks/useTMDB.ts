import { useQuery } from "@tanstack/react-query";

import { tmdbApi } from "#/lib/tmdb";
import { tmdbSearchResponseSchema } from "#/schemas/tmdb";
import { useTMDBStore } from "#/stores/tmdb";

type TMDBImageKind = "poster" | "still";

async function fetchTMDBImage(title: string, kind: TMDBImageKind) {
  if (!import.meta.env.VITE_TMDB_API_KEY?.trim() || !title.trim()) {
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

  return imagePath ? `https://image.tmdb.org/t/p/w500${imagePath}` : null;
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
