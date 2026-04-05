import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { getCredentials, setCredentials } from "#/lib/auth";
import { renderAppRoute } from "#/test/test-utils";

const useShowsMock = vi.fn();
const useTMDBMock = vi.fn();
const apiPostMock = vi.fn();

vi.mock("#/hooks/useShows", () => ({
  useShows: () => useShowsMock(),
}));

vi.mock("#/hooks/useTMDB", () => ({
  useTMDB: (...args: unknown[]) => useTMDBMock(...args),
}));

vi.mock("#/lib/api", () => ({
  api: {
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}));

function mockHomeQueriesWithEmptyResults() {
  useShowsMock.mockReturnValue({
    data: [],
  });
  useTMDBMock.mockReturnValue({
    imageUrl: null,
    isError: false,
    isFromCache: false,
    isLoading: false,
  });
  apiPostMock.mockResolvedValue({
    data: {
      result: [],
    },
  });
}

describe("authentication workflow", () => {
  beforeEach(() => {
    mockHomeQueriesWithEmptyResults();
  });

  it("redirects guests from protected routes to login", async () => {
    await renderAppRoute("/");

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  }, 15000);

  it("redirects authenticated users away from login", async () => {
    setCredentials("goledger", "secret");

    await renderAppRoute("/login");

    expect(await screen.findByRole("link", { name: "GoLedger TV" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Shows" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Watchlists" }).length).toBeGreaterThan(0);
  }, 15000);

  it("shows validation errors before submitting an empty login form", async () => {
    const user = userEvent.setup();

    await renderAppRoute("/login");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  }, 15000);

  it("signs in and renders the protected shell", async () => {
    const user = userEvent.setup();

    await renderAppRoute("/login");

    await user.type(screen.getByLabelText("Username"), "goledger");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("link", { name: "GoLedger TV" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Shows" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Watchlists" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(getCredentials()).toBe("Z29sZWRnZXI6c2VjcmV0");
  }, 15000);

  it("logs out from the protected shell and returns to login", async () => {
    const user = userEvent.setup();
    setCredentials("goledger", "secret");

    await renderAppRoute("/");

    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(getCredentials()).toBeUndefined();
  }, 15000);
});
