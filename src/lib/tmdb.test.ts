import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

vi.mock("axios", async importOriginal => {
  const actual = await importOriginal<typeof import("axios")>();

  return {
    ...actual,
    default: actual.default,
  };
});

function getRequestInterceptor(api: AxiosInstance) {
  const handlers = api.interceptors.request.handlers ?? [];
  const handler = handlers.find(entry => entry?.fulfilled)?.fulfilled;

  if (!handler) {
    throw new Error("Expected TMDB request interceptor to be registered.");
  }

  return handler;
}

describe("tmdbApi", () => {
  const originalTmdbKey = import.meta.env.VITE_TMDB_API_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    import.meta.env.VITE_TMDB_API_KEY = originalTmdbKey;
  });

  it("adds shared TMDB params and an api_key for v3 keys", async () => {
    import.meta.env.VITE_TMDB_API_KEY = "tmdb-v3-key";
    const { tmdbApi } = await import("#/lib/tmdb");
    const intercept = getRequestInterceptor(tmdbApi);

    const config = await intercept({
      headers: {} as InternalAxiosRequestConfig["headers"],
      params: {
        query: "Ted Lasso",
      },
    } as InternalAxiosRequestConfig);

    expect(config.params).toEqual({
      api_key: "tmdb-v3-key",
      include_adult: "false",
      language: "en-US",
      page: "1",
      query: "Ted Lasso",
    });
    expect(config.headers?.Authorization).toBeUndefined();
  });

  it("uses a bearer header when the TMDB key looks like a token", async () => {
    import.meta.env.VITE_TMDB_API_KEY = "eyJ-token-value";
    const { tmdbApi } = await import("#/lib/tmdb");
    const intercept = getRequestInterceptor(tmdbApi);

    const config = await intercept({
      headers: {} as InternalAxiosRequestConfig["headers"],
      params: {},
    } as InternalAxiosRequestConfig);

    expect(config.headers?.Authorization).toBe("Bearer eyJ-token-value");
    expect(config.params).toEqual({
      include_adult: "false",
      language: "en-US",
      page: "1",
    });
  });

  it("leaves the request untouched when no TMDB key is configured", async () => {
    import.meta.env.VITE_TMDB_API_KEY = "";
    const { tmdbApi } = await import("#/lib/tmdb");
    const intercept = getRequestInterceptor(tmdbApi);

    const config = await intercept({
      headers: {} as InternalAxiosRequestConfig["headers"],
      params: {
        query: "Ted Lasso",
      },
    } as InternalAxiosRequestConfig);

    expect(config.params).toEqual({
      query: "Ted Lasso",
    });
    expect(config.headers?.Authorization).toBeUndefined();
  });
});
