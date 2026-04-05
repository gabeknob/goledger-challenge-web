import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { setCredentials } from "#/lib/auth";
import { Route as LoginRoute } from "#/routes/login";
import { renderRoute } from "#/test/test-utils";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => false),
    setCredentials: vi.fn(),
  };
});

describe("login page", () => {
  const LoginPage = LoginRoute.options.component!;

  it("renders the login form and validates empty fields", async () => {
    const user = userEvent.setup();

    await renderRoute({
      component: LoginPage,
      path: "/login",
    });

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(setCredentials).not.toHaveBeenCalled();
  }, 10000);

  it("submits credentials and navigates home", async () => {
    const user = userEvent.setup();

    await renderRoute({
      component: LoginPage,
      path: "/login",
    });

    await user.type(screen.getByLabelText("Username"), "goledger");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(setCredentials).toHaveBeenCalledWith("goledger", "secret");
    expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
  }, 10000);
});
