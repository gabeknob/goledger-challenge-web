import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TMDBImageKind = "poster" | "still";
type TMDBImageValue = string | null;

interface TMDBStoreState {
  posters: Record<string, TMDBImageValue>;
  stills: Record<string, TMDBImageValue>;
  getImage: (kind: TMDBImageKind, title: string) => TMDBImageValue | undefined;
  setImage: (kind: TMDBImageKind, title: string, imageUrl: TMDBImageValue) => void;
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

export const useTMDBStore = create<TMDBStoreState>()(
  persist(
    (set, get) => ({
      posters: {},
      stills: {},
      getImage: (kind, title) => {
        const normalizedTitle = normalizeTitle(title);
        return kind === "poster" ? get().posters[normalizedTitle] : get().stills[normalizedTitle];
      },
      setImage: (kind, title, imageUrl) => {
        const normalizedTitle = normalizeTitle(title);

        set(state => ({
          posters:
            kind === "poster" ? { ...state.posters, [normalizedTitle]: imageUrl } : state.posters,
          stills:
            kind === "still" ? { ...state.stills, [normalizedTitle]: imageUrl } : state.stills,
        }));
      },
    }),
    {
      name: "tmdb-image-cache",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
