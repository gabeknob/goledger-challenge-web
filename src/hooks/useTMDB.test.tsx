import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { useTMDB, useTMDBEpisodeStill } from "#/hooks/useTMDB";
import { tmdbApi } from "#/lib/tmdb";
import { useTMDBStore } from "#/stores/tmdb";

vi.mock("#/lib/tmdb", () => ({
  tmdbApi: {
    get: vi.fn(),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useTMDB", () => {
  const originalTmdbKey = import.meta.env.VITE_TMDB_API_KEY;

  beforeEach(() => {
    import.meta.env.VITE_TMDB_API_KEY = "tmdb-test-key";
    useTMDBStore.setState({
      posters: {},
      seriesIds: {},
      stills: {},
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    import.meta.env.VITE_TMDB_API_KEY = originalTmdbKey;
    localStorage.clear();
  });

  it("returns cached poster images without hitting TMDB", () => {
    useTMDBStore.getState().setImage("poster", "Ted Lasso", "https://cached/poster.jpg");

    const { result } = renderHook(() => useTMDB("Ted Lasso", "poster"), {
      wrapper: createWrapper(),
    });

    expect(result.current.imageUrl).toBe("https://cached/poster.jpg");
    expect(result.current.isFromCache).toBe(true);
    expect(tmdbApi.get).not.toHaveBeenCalled();
  });

  it("fetches a poster from TMDB and caches it when missing", async () => {
    vi.mocked(tmdbApi.get).mockResolvedValue({
      data: {
        results: [
          {
            backdrop_path: "/backdrop.jpg",
            id: 1,
            name: "Ted Lasso",
            poster_path: "/poster.jpg",
          },
        ],
      },
    } as never);

    const { result } = renderHook(() => useTMDB("Ted Lasso", "poster"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
    });

    expect(useTMDBStore.getState().getImage("poster", "Ted Lasso")).toBe(
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
  });

  it("uses the backdrop path when requesting a still-like image for a show", async () => {
    vi.mocked(tmdbApi.get).mockResolvedValue({
      data: {
        results: [
          {
            backdrop_path: "/backdrop.jpg",
            id: 1,
            name: "Ted Lasso",
            poster_path: "/poster.jpg",
          },
        ],
      },
    } as never);

    const { result } = renderHook(() => useTMDB("Ted Lasso", "still"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("https://image.tmdb.org/t/p/w500/backdrop.jpg");
    });
  });

  it("short-circuits poster fetching when there is no TMDB key", async () => {
    import.meta.env.VITE_TMDB_API_KEY = "";

    const { result } = renderHook(() => useTMDB("Ted Lasso", "poster"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.imageUrl).toBe(null);
    });
    expect(useTMDBStore.getState().getImage("poster", "Ted Lasso")).toBe(null);
    expect(tmdbApi.get).not.toHaveBeenCalled();
  });

  it("short-circuits episode still fetching when there is no TMDB key", async () => {
    import.meta.env.VITE_TMDB_API_KEY = "";

    const { result } = renderHook(
      () =>
        useTMDBEpisodeStill({
          episodeNumber: 1,
          seasonNumber: 1,
          showTitle: "Ted Lasso",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe(null);
    });
    expect(useTMDBStore.getState().getSeriesId("Ted Lasso")).toBe(null);
    expect(tmdbApi.get).not.toHaveBeenCalled();
  });

  it("prefers an exact original title match when resolving a series id", async () => {
    vi.mocked(tmdbApi.get)
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 12,
              name: "Bleach: Legacy",
              original_name: "Bleach",
            },
            {
              id: 13,
              name: "Bleach Legacy",
              original_name: "Bleach: Legacy",
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          still_path: "/exact-original.jpg",
        },
      } as never);

    const { result } = renderHook(
      () =>
        useTMDBEpisodeStill({
          episodeNumber: 1,
          seasonNumber: 1,
          showTitle: "Bleach",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("https://image.tmdb.org/t/p/w500/exact-original.jpg");
    });

    expect(tmdbApi.get).toHaveBeenCalledWith("/tv/12/season/1/episode/1");
  });

  it("falls back to the first TMDB result when there is no exact title match", async () => {
    vi.mocked(tmdbApi.get)
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 44,
              name: "Bleach Returns",
              original_name: "Bleach Returns",
            },
            {
              id: 45,
              name: "Bleach Again",
              original_name: "Bleach Again",
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          still_path: "/fallback-first-result.jpg",
        },
      } as never);

    const { result } = renderHook(
      () =>
        useTMDBEpisodeStill({
          episodeNumber: 1,
          seasonNumber: 1,
          showTitle: "Bleach",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe(
        "https://image.tmdb.org/t/p/w500/fallback-first-result.jpg",
      );
    });

    expect(tmdbApi.get).toHaveBeenCalledWith("/tv/44/season/1/episode/1");
  });

  it("fetches an episode still through the exact season/episode path", async () => {
    vi.mocked(tmdbApi.get)
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 99,
              name: "Ted Lasso",
              original_name: "Ted Lasso",
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          still_path: "/still.jpg",
        },
      } as never);

    const { result } = renderHook(
      () =>
        useTMDBEpisodeStill({
          episodeNumber: 1,
          seasonNumber: 1,
          showTitle: "Ted Lasso",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("https://image.tmdb.org/t/p/w500/still.jpg");
    });
    expect(useTMDBStore.getState().getSeriesId("Ted Lasso")).toBe(99);
  });

  it("falls back to flattened numbering and episode images when needed", async () => {
    vi.mocked(tmdbApi.get)
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 77,
              name: "Bleach",
              original_name: "Bleach",
            },
          ],
        },
      } as never)
      .mockRejectedValueOnce(new Error("missing exact episode"))
      .mockResolvedValueOnce({
        data: {
          still_path: null,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          stills: [{ file_path: "/fallback-still.jpg" }],
        },
      } as never);

    const { result } = renderHook(
      () =>
        useTMDBEpisodeStill({
          episodeNumber: 1,
          fallbackEpisodeNumber: 25,
          seasonNumber: 2,
          showTitle: "Bleach",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("https://image.tmdb.org/t/p/w500/fallback-still.jpg");
    });

    expect(tmdbApi.get).toHaveBeenCalledWith("/tv/77/season/1/episode/25");
    expect(tmdbApi.get).toHaveBeenCalledWith("/tv/77/season/1/episode/25/images");
  });

  it("returns null when no still is found for any episode candidate", async () => {
    vi.mocked(tmdbApi.get)
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 88,
              name: "Naruto",
              original_name: "Naruto",
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          still_path: null,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          stills: [],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          still_path: null,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          stills: [],
        },
      } as never);

    const { result } = renderHook(
      () =>
        useTMDBEpisodeStill({
          episodeNumber: 1,
          fallbackEpisodeNumber: 25,
          seasonNumber: 2,
          showTitle: "Naruto",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe(null);
    });
    expect(useTMDBStore.getState().getImage("still", "Naruto::s2e1::f25")).toBe(null);
  });
});
