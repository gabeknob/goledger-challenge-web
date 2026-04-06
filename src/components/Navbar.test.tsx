import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Navbar } from "#/components/Navbar";
import { useThemeStore } from "#/stores/theme";
import { renderRoute } from "#/test/test-utils";

vi.mock("#/hooks/useAuth", () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

describe("Navbar dark mode toggle", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "dark" });
  });

  it("shows 'Switch to light mode' label when in dark mode", async () => {
    await renderRoute({ component: Navbar, path: "/" });

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("shows 'Switch to dark mode' label when in light mode", async () => {
    useThemeStore.setState({ theme: "light" });

    await renderRoute({ component: Navbar, path: "/" });

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("switches to light mode when toggled from dark", async () => {
    const user = userEvent.setup();

    await renderRoute({ component: Navbar, path: "/" });

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(useThemeStore.getState().theme).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("switches to dark mode when toggled from light", async () => {
    useThemeStore.setState({ theme: "light" });
    const user = userEvent.setup();

    await renderRoute({ component: Navbar, path: "/" });

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(useThemeStore.getState().theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });
});
