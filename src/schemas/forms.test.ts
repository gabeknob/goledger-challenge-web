import { loginSchema } from "#/schemas/auth";
import { createEpisodeSchema } from "#/schemas/episode";
import { createSeasonSchema } from "#/schemas/season";
import { createTvShowSchema } from "#/schemas/tvShow";
import { createWatchlistSchema } from "#/schemas/watchlist";
import { makeEpisode, makeSeason, makeTvShow, makeWatchlist } from "#/test/factories";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ username: "goledger", password: "secret" });

    expect(result.success).toBe(true);
  });

  it("requires both fields", () => {
    const result = loginSchema.safeParse({ username: "", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toEqual({
      password: ["Password is required"],
      username: ["Username is required"],
    });
  });
});

describe("createTvShowSchema", () => {
  it("rejects duplicate titles while allowing the current title in edit mode", () => {
    const existingShows = [makeTvShow({ title: "Ted Lasso" }), makeTvShow({ title: "Lost" })];
    const createResult = createTvShowSchema(existingShows).safeParse({
      title: "ted lasso",
      description: "Duplicate",
      recommendedAge: 16,
    });
    const editResult = createTvShowSchema(existingShows, "Ted Lasso").safeParse({
      title: "Ted Lasso",
      description: "Updated",
      recommendedAge: 16,
    });

    expect(createResult.success).toBe(false);
    expect(createResult.error?.flatten().fieldErrors.title).toEqual([
      "A TV show with this title already exists",
    ]);
    expect(editResult.success).toBe(true);
  });

  it("requires recommendedAge", () => {
    const result = createTvShowSchema([]).safeParse({
      title: "Ted Lasso",
      description: "Nice",
      recommendedAge: undefined,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.recommendedAge).toEqual([
      "Recommended age is required",
    ]);
  });
});

describe("createSeasonSchema", () => {
  it("rejects duplicate season numbers", () => {
    const existingSeasons = [makeSeason({ number: 1 }), makeSeason({ number: 2 })];
    const result = createSeasonSchema(existingSeasons).safeParse({
      number: 2,
      year: 2021,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.number).toEqual([
      "This show already has a season with that number",
    ]);
  });
});

describe("createEpisodeSchema", () => {
  it("accepts an empty rating and normalizes it to undefined", () => {
    const result = createEpisodeSchema([]).safeParse({
      episodeNumber: 1,
      title: "Pilot",
      releaseDate: "2020-08-14",
      description: "The first episode",
      rating: "",
    });

    expect(result.success).toBe(true);
    expect(result.data?.rating).toBeUndefined();
  });

  it("rejects invalid release dates, duplicate numbers, and ratings above 10", () => {
    const existingEpisodes = [makeEpisode({ episodeNumber: 1 })];
    const result = createEpisodeSchema(existingEpisodes).safeParse({
      episodeNumber: 1,
      title: "Pilot",
      releaseDate: "not-a-date",
      description: "The first episode",
      rating: 11,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      episodeNumber: ["This season already has an episode with that number"],
      rating: ["Rating cannot be greater than 10"],
      releaseDate: ["Release date must be valid"],
    });
  });
});

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
});
