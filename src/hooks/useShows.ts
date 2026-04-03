import { useQuery } from "@tanstack/react-query";
import { api } from "#/lib/api";
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

export function useShows() {
  return useQuery({
    queryKey: ["shows"],
    queryFn: fetchShows,
  });
}
