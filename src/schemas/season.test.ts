import { createSeasonSchema } from "#/schemas/season";
import { makeSeason } from "#/test/factories";

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

  it("allows the current season number in edit mode", () => {
    const currentSeason = makeSeason({ number: 2 });
    const result = createSeasonSchema([makeSeason({ number: 1 }), currentSeason], currentSeason)
      .safeParse({
        number: 2,
        year: 2024,
      });

    expect(result.success).toBe(true);
  });
});
