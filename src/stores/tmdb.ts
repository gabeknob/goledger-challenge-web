import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TMDBImageKind = "poster" | "still";
type TMDBImageValue = string | null;
type TMDBSeriesIdValue = number | null;

interface TMDBStoreState {
  posters: Record<string, TMDBImageValue>;
  seriesIds: Record<string, TMDBSeriesIdValue>;
  stills: Record<string, TMDBImageValue>;
  getImage: (kind: TMDBImageKind, cacheKey: string) => TMDBImageValue | undefined;
  getSeriesId: (showTitle: string) => TMDBSeriesIdValue | undefined;
  setImage: (kind: TMDBImageKind, cacheKey: string, imageUrl: TMDBImageValue) => void;
  setSeriesId: (showTitle: string, seriesId: TMDBSeriesIdValue) => void;
}

function normalizeCacheKey(value: string) {
  return value.trim().toLowerCase();
}

export const useTMDBStore = create<TMDBStoreState>()(
  persist(
    (set, get) => ({
      posters: {},
      seriesIds: {},
      stills: {},
      getImage: (kind, cacheKey) => {
        const normalizedKey = normalizeCacheKey(cacheKey);
        return kind === "poster" ? get().posters[normalizedKey] : get().stills[normalizedKey];
      },
      getSeriesId: showTitle => {
        const normalizedTitle = normalizeCacheKey(showTitle);
        return get().seriesIds[normalizedTitle];
      },
      setImage: (kind, cacheKey, imageUrl) => {
        const normalizedKey = normalizeCacheKey(cacheKey);

        set(state => ({
          posters:
            kind === "poster" ? { ...state.posters, [normalizedKey]: imageUrl } : state.posters,
          stills: kind === "still" ? { ...state.stills, [normalizedKey]: imageUrl } : state.stills,
          seriesIds: state.seriesIds,
        }));
      },
      setSeriesId: (showTitle, seriesId) => {
        const normalizedTitle = normalizeCacheKey(showTitle);

        set(state => ({
          posters: state.posters,
          seriesIds: { ...state.seriesIds, [normalizedTitle]: seriesId },
          stills: state.stills,
        }));
      },
    }),
    {
      name: "tmdb-image-cache-v3",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
