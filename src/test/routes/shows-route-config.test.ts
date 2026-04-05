import { Route as ShowLayoutRoute } from "#/routes/_auth/shows";
import { Route as ShowParentRoute } from "#/routes/_auth/shows/$showId";

describe("shows route config", () => {
  it("provides the static breadcrumb for the shows layout", () => {
    expect(ShowLayoutRoute.options.staticData).toEqual({ crumb: "Shows" });
  });

  it("decodes the show id for the nested show breadcrumb", async () => {
    const loader = ShowParentRoute.options.loader;

    if (typeof loader !== "function") {
      throw new Error("Expected show parent loader to be callable.");
    }

    expect(
      loader({
        abortController: new AbortController(),
        cause: "enter",
        context: {},
        deps: {},
        location: {} as never,
        navigate: (() => undefined) as never,
        params: { showId: "Ted%20Lasso" },
        parentMatchPromise: Promise.resolve(undefined) as never,
        preload: false,
        route: ShowParentRoute as never,
      }),
    ).toEqual({ crumb: "Ted Lasso" });
  });
});
