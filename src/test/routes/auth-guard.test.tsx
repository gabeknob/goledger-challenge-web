import { isAuthenticated } from "#/lib/auth";
import { Route as AuthRoute } from "#/routes/_auth";
import { Route as LoginRoute } from "#/routes/login";

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => true),
  };
});

describe("route guards", () => {
  it("redirects guests away from protected routes", () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);

    try {
      AuthRoute.options.beforeLoad?.({} as never);
      throw new Error("Expected a redirect");
    } catch (error) {
      expect(error).toMatchObject({ options: { to: "/login" } });
    }
  });

  it("allows authenticated users into protected routes", () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    expect(() => AuthRoute.options.beforeLoad?.({} as never)).not.toThrow();
  });

  it("redirects authenticated users away from login", () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    try {
      LoginRoute.options.beforeLoad?.({} as never);
      throw new Error("Expected a redirect");
    } catch (error) {
      expect(error).toMatchObject({ options: { to: "/" } });
    }
  });
});
