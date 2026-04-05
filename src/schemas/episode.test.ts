import { createEpisodeSchema } from "#/schemas/episode";
import { makeEpisode } from "#/test/factories";

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

  it("allows the current episode number in edit mode", () => {
    const currentEpisode = makeEpisode({ episodeNumber: 1 });
    const result = createEpisodeSchema(
      [currentEpisode, makeEpisode({ episodeNumber: 2 })],
      currentEpisode,
    ).safeParse({
      episodeNumber: 1,
      title: "Pilot",
      releaseDate: "2020-08-14",
      description: "The first episode",
      rating: 8.3,
    });

    expect(result.success).toBe(true);
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
