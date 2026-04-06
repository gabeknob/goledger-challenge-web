import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { useLogin } from "#/hooks/useLogin";
import { isAuthenticated } from "#/lib/auth";
import { Route as LoginRoute } from "#/routes/login";
import { renderRoute } from "#/test/test-utils";

vi.mock("#/hooks/useLogin");

vi.mock("#/lib/auth", async (importOriginal: <T>() => Promise<T>) => {
  const actual = await importOriginal<typeof import("#/lib/auth")>();

  return {
    ...actual,
    isAuthenticated: vi.fn(() => false),
  };
});

describe("login page", () => {
  const LoginPage = LoginRoute.options.component!;
  const loginMock = vi.fn();

  beforeEach(() => {
    vi.mocked(useLogin).mockReturnValue({
      login: loginMock,
      isPending: false,
      isError: false,
    });
  });

  it("renders the login form and validates empty fields", async () => {
    const user = userEvent.setup();

    await renderRoute({ component: LoginPage, path: "/login" });

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  }, 10000);

  it("calls login with the entered credentials on submit", async () => {
    const user = userEvent.setup();

    await renderRoute({ component: LoginPage, path: "/login" });

    await user.type(screen.getByLabelText("Username"), "goledger");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(loginMock).toHaveBeenCalledWith({ username: "goledger", password: "secret" });
  }, 10000);

  it("shows a spinner and disables the form while pending", async () => {
    vi.mocked(useLogin).mockReturnValue({
      login: loginMock,
      isPending: true,
      isError: false,
    });

    await renderRoute({ component: LoginPage, path: "/login" });

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    expect(screen.getByLabelText("Username")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  }, 10000);

  it("shows an error message when login fails", async () => {
    vi.mocked(useLogin).mockReturnValue({
      login: loginMock,
      isPending: false,
      isError: true,
    });

    await renderRoute({ component: LoginPage, path: "/login" });

    expect(screen.getByText("Invalid credentials. Please try again.")).toBeInTheDocument();
  }, 10000);

  it("redirects to home if already authenticated", () => {
    vi.mocked(isAuthenticated).mockReturnValueOnce(true);

    expect(() => LoginRoute.options.beforeLoad?.({} as never)).toThrow();
  });
});
