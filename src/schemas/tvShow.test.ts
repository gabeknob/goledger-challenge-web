import { createTvShowSchema } from "#/schemas/tvShow";
import { makeTvShow } from "#/test/factories";

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
