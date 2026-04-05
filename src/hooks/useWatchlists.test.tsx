import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  useCreateWatchlist,
  useDeleteWatchlist,
  useUpdateWatchlist,
  useWatchlist,
  useWatchlists,
} from "#/hooks/useWatchlists";
import { queryClient } from "#/lib/queryClient";
import { api } from "#/lib/api";
import { makeTvShow, makeWatchlist } from "#/test/factories";

vi.mock("#/lib/api", () => ({
  api: {
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useWatchlists", () => {
  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("creates a watchlist and invalidates the watchlists query", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useCreateWatchlist(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      description: "Weekend queue",
      title: "Weekend Queue",
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
        asset: [
          {
            "@assetType": "watchlist",
            description: "Weekend queue",
            title: "Weekend Queue",
          },
        ],
      });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists"],
      });
    });
  });

  it("fetches and sorts watchlists alphabetically", async () => {
    const beta = makeWatchlist({ title: "Beta" });
    const alpha = makeWatchlist({ title: "Alpha" });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        result: [beta, alpha],
      },
    } as never);

    const { result } = renderHook(() => useWatchlists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.map(watchlist => watchlist.title)).toEqual(["Alpha", "Beta"]);
    });

    expect(api.post).toHaveBeenCalledWith("/query/search", {
      query: {
        selector: {
          "@assetType": "watchlist",
        },
      },
    });
  });

  it("fetches a single watchlist by title", async () => {
    const watchlist = makeWatchlist({ title: "Favorites" });
    vi.mocked(api.post).mockResolvedValue({ data: watchlist } as never);

    const { result } = renderHook(() => useWatchlist("Favorites"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(watchlist);
    });

    expect(api.post).toHaveBeenCalledWith("/query/readAsset", {
      key: {
        "@assetType": "watchlist",
        title: "Favorites",
      },
    });
  });

  it("updates a watchlist in place when the title stays the same", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const current = makeWatchlist({
      description: "Original description",
      title: "Favorites",
      tvShows: [
        {
          "@assetType": "tvShows",
          "@key": makeTvShow({ title: "Ted Lasso" })["@key"],
        },
      ],
    });

    const { result } = renderHook(() => useUpdateWatchlist(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current,
      next: {
        description: "Updated description",
        title: "Favorites",
      },
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/invoke/updateAsset", {
        update: {
          "@assetType": "watchlist",
          description: "Updated description",
          title: "Favorites",
          tvShows: current.tvShows,
        },
      });
    });

    expect(api.delete).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists", "Favorites"],
      });
    });
  });

  it("renames a watchlist through create-and-delete and invalidates old and new detail queries", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    const current = makeWatchlist({
      description: "Original list",
      title: "Favorites",
      tvShows: [
        {
          "@assetType": "tvShows",
          "@key": makeTvShow({ title: "Ted Lasso" })["@key"],
        },
      ],
    });

    const { result } = renderHook(() => useUpdateWatchlist(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      current,
      next: {
        description: "Renamed list",
        title: "All-Time Favorites",
      },
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/invoke/createAsset", {
        asset: [
          {
            "@assetType": "watchlist",
            description: "Renamed list",
            title: "All-Time Favorites",
            tvShows: current.tvShows,
          },
        ],
      });
    });

    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "watchlist",
          title: "Favorites",
        },
      },
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists", "Favorites"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["watchlists", "All-Time Favorites"],
      });
    });
  });

  it("deletes a watchlist and invalidates the watchlists query", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const watchlist = makeWatchlist({ title: "Favorites" });

    const { result } = renderHook(() => useDeleteWatchlist(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(watchlist);

    expect(api.delete).toHaveBeenCalledWith("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "watchlist",
          title: "Favorites",
        },
      },
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["watchlists"],
    });
  });
});
