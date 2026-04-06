import { useThemeStore } from "#/stores/theme";

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "dark" });
  });

  it("defaults to dark theme", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggles from dark to light", () => {
    useThemeStore.getState().toggle();

    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggles from light back to dark", () => {
    useThemeStore.setState({ theme: "light" });
    useThemeStore.getState().toggle();

    expect(useThemeStore.getState().theme).toBe("dark");
  });
});
