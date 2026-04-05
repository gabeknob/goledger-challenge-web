import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { api } from "#/lib/api";
import { makeTvShow, makeWatchlist } from "#/test/factories";
import { HomePage } from "#/routes/_auth/index";
import { renderRoute } from "#/test/test-utils";

const useShowsMock = vi.fn();
const useTMDBMock = vi.fn();

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => true),
  };
});

vi.mock("#/hooks/useShows", () => ({
  useShows: () => useShowsMock(),
}));

vi.mock("#/hooks/useTMDB", () => ({
  useTMDB: (...args: unknown[]) => useTMDBMock(...args),
}));

vi.mock("#/components/Navbar", () => ({
  Navbar: () => null,
}));

vi.mock("#/components/Breadcrumbs", () => ({
  Breadcrumbs: () => null,
}));

vi.mock("#/components/BottomTabBar", () => ({
  BottomTabBar: () => null,
}));

vi.mock("#/components/WatchlistCard", () => ({
  WatchlistCard: ({
    itemTitles,
    onDelete,
    onEdit,
    watchlist,
  }: {
    itemTitles: string[];
    onDelete: () => void;
    onEdit: () => void;
    watchlist: { title: string };
  }) => (
    <div>
      <div>{watchlist.title}</div>
      <button type="button" onClick={onEdit}>
        Edit {watchlist.title}
      </button>
      <button type="button" onClick={onDelete}>
        Delete {watchlist.title}
      </button>
      {itemTitles.map(title => (
        <div key={title}>{title}</div>
      ))}
    </div>
  ),
}));

vi.mock("#/lib/api", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/api")>();

  return {
    ...actual,
    api: {
      ...actual.api,
      post: vi.fn(),
    },
  };
});

describe("home dashboard", () => {
  beforeEach(() => {
    useShowsMock.mockReturnValue({ data: [] });
    useTMDBMock.mockReturnValue({ imageUrl: null, isLoading: false });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        result: [],
      },
    } as never);
  });

  it("shows an empty state for each section independently", async () => {
    await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        {
          path: "/shows",
        },
        {
          path: "/watchlists",
        },
      ],
    });

    expect(
      screen.getByText("Add a few shows to turn this space into a spotlight carousel."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No shows yet. Add your first title to start building the dashboard."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No watchlists yet. Create one to start grouping shows by mood, genre, or occasion.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Create your first show" })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.getByRole("link", { name: "Create a show" })).toHaveAttribute("href", "/shows");
    expect(screen.getByRole("link", { name: "Create a watchlist" })).toHaveAttribute(
      "href",
      "/watchlists",
    );
  }, 15000);

  it("shows loading skeletons while dashboard queries are pending", async () => {
    vi.mocked(api.post).mockImplementation(
      () => new Promise(() => {}) as ReturnType<typeof api.post>,
    );

    const { container } = await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        { path: "/shows" },
        { path: "/watchlists" },
      ],
    });

    expect(container.getElementsByClassName("animate-pulse").length).toBeGreaterThan(0);
  }, 15000);

  it("shows error messages independently when dashboard sections fail", async () => {
    vi.mocked(api.post)
      .mockRejectedValueOnce(new Error("recent failed"))
      .mockRejectedValueOnce(new Error("alphabetical failed"))
      .mockRejectedValueOnce(new Error("watchlists failed"));

    await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        { path: "/shows" },
        { path: "/watchlists" },
      ],
    });

    expect(await screen.findByText("Failed to load the latest shows.")).toBeInTheDocument();
    expect(screen.getByText("Could not load the TV shows strip.")).toBeInTheDocument();
    expect(screen.getByText("Could not load the watchlists strip.")).toBeInTheDocument();
  }, 15000);

  it("renders populated sections and supports carousel navigation", async () => {
    const user = userEvent.setup();
    const recentShows = [
      makeTvShow({ title: "Ted Lasso" }),
      makeTvShow({ title: "Severance" }),
    ];
    const alphabeticalShows = Array.from({ length: 10 }, (_, index) =>
      makeTvShow({
        title: `Show ${index + 1}`,
        "@key": `tvShows:show-${index + 1}`,
      }),
    );
    const watchlists = Array.from({ length: 5 }, (_, index) =>
      makeWatchlist({
        title: `Watchlist ${index + 1}`,
        "@key": `watchlist:${index + 1}`,
        tvShows: [
          {
            "@assetType": "tvShows",
            "@key": alphabeticalShows[index % alphabeticalShows.length]["@key"],
          },
        ],
      }),
    );

    useShowsMock.mockReturnValue({ data: alphabeticalShows });
    useTMDBMock.mockImplementation((title: string) => ({
      imageUrl: `https://example.com/${title}.jpg`,
      isLoading: false,
    }));
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { result: recentShows } } as never)
      .mockResolvedValueOnce({ data: { result: alphabeticalShows } } as never)
      .mockResolvedValueOnce({ data: { result: watchlists } } as never);

    await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        { path: "/shows" },
        { path: "/watchlists" },
        { path: "/shows/$showId" },
      ],
    });

    expect(await screen.findByRole("heading", { name: "Ted Lasso" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /View all/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /See all watchlists/i })).toHaveAttribute(
      "href",
      "/watchlists",
    );
    expect(screen.getByRole("link", { name: /See more/i })).toHaveAttribute("href", "/shows");
    expect(screen.getByText("Watchlist 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next show" }));

    expect(await screen.findByRole("heading", { name: "Severance" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to Ted Lasso" }));

    expect(await screen.findByRole("heading", { name: "Ted Lasso" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous show" }));

    expect(await screen.findByRole("heading", { name: "Severance" })).toBeInTheDocument();
  }, 15000);

  it("renders populated cards without TMDB artwork and skips overflow cards when lists are short", async () => {
    const recentShows = [makeTvShow({ title: "Ted Lasso" })];
    const alphabeticalShows = [
      makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted-lasso" }),
      makeTvShow({ title: "Severance", "@key": "tvShows:severance" }),
    ];
    const watchlists = Array.from({ length: 4 }, (_, index) =>
      makeWatchlist({
        title: `Watchlist ${index + 1}`,
        "@key": `watchlist:${index + 1}`,
        tvShows: [
          {
            "@assetType": "tvShows",
            "@key": alphabeticalShows[index % alphabeticalShows.length]["@key"],
          },
        ],
      }),
    );

    useShowsMock.mockReturnValue({ data: alphabeticalShows });
    useTMDBMock.mockReturnValue({ imageUrl: null, isLoading: false });
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { result: recentShows } } as never)
      .mockResolvedValueOnce({ data: { result: alphabeticalShows } } as never)
      .mockResolvedValueOnce({ data: { result: watchlists } } as never);

    const { container } = await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        { path: "/shows" },
        { path: "/watchlists" },
        { path: "/shows/$showId" },
      ],
    });

    expect(await screen.findByRole("heading", { name: "Ted Lasso" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /See all watchlists/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /See more/i })).not.toBeInTheDocument();
    expect(screen.getByText("Watchlist 4")).toBeInTheDocument();
    expect(screen.queryByAltText("Ted Lasso poster")).not.toBeInTheDocument();
    expect(container.querySelector('img[alt="Severance poster"]')).toBeNull();
  }, 15000);

  it("falls back to unknown show when a watchlist key is missing from the show map", async () => {
    const recentShows = [makeTvShow({ title: "Ted Lasso" })];
    const alphabeticalShows = [makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted-lasso" })];
    const watchlists = [
      makeWatchlist({
        title: "Broken references",
        "@key": "watchlist:broken",
        tvShows: [
          {
            "@assetType": "tvShows",
            "@key": "tvShows:missing-show",
          },
        ],
      }),
    ];

    useShowsMock.mockReturnValue({ data: alphabeticalShows });
    useTMDBMock.mockReturnValue({ imageUrl: null, isLoading: false });
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { result: recentShows } } as never)
      .mockResolvedValueOnce({ data: { result: alphabeticalShows } } as never)
      .mockResolvedValueOnce({ data: { result: watchlists } } as never);

    await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        { path: "/shows" },
        { path: "/watchlists" },
        { path: "/shows/$showId" },
      ],
    });

    expect(await screen.findByText("Broken references")).toBeInTheDocument();
    expect(screen.getByText("Unknown show")).toBeInTheDocument();
  }, 15000);

  it("supports watchlists without tv show references", async () => {
    const user = userEvent.setup();
    const recentShows = [makeTvShow({ title: "Ted Lasso" })];
    const alphabeticalShows = [makeTvShow({ title: "Ted Lasso", "@key": "tvShows:ted-lasso" })];
    const watchlists = [
      {
        ...makeWatchlist({
          title: "Empty references",
          "@key": "watchlist:empty-references",
        }),
        tvShows: undefined,
      },
    ];

    useShowsMock.mockReturnValue({ data: alphabeticalShows });
    useTMDBMock.mockReturnValue({ imageUrl: null, isLoading: false });
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { result: recentShows } } as never)
      .mockResolvedValueOnce({ data: { result: alphabeticalShows } } as never)
      .mockResolvedValueOnce({ data: { result: watchlists } } as never);

    await renderRoute({
      component: HomePage,
      path: "/",
      additionalRoutes: [
        { path: "/shows" },
        { path: "/watchlists" },
        { path: "/shows/$showId" },
      ],
    });

    expect(await screen.findByText("Empty references")).toBeInTheDocument();
    expect(screen.queryByText("Unknown show")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Empty references" }));
    await user.click(screen.getByRole("button", { name: "Delete Empty references" }));
  }, 15000);
});
