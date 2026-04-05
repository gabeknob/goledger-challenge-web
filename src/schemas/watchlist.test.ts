import { createWatchlistSchema } from "#/schemas/watchlist";
import { makeWatchlist } from "#/test/factories";

describe("createWatchlistSchema", () => {
  it("rejects duplicate watchlist titles", () => {
    const existingWatchlists = [makeWatchlist({ title: "Favorites" })];
    const result = createWatchlistSchema(existingWatchlists).safeParse({
      title: "favorites",
      description: "Weekend picks",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.title).toEqual([
      "A watchlist with this title already exists",
    ]);
  });

  it("allows the current watchlist title in edit mode", () => {
    const currentWatchlist = makeWatchlist({ title: "Favorites" });
    const result = createWatchlistSchema(
      [currentWatchlist, makeWatchlist({ title: "Weekend Queue" })],
      currentWatchlist.title,
    ).safeParse({
      title: "Favorites",
      description: "Updated description",
    });

    expect(result.success).toBe(true);
  });
});
