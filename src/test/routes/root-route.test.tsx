import { screen } from "@testing-library/react";

import { Route as RootRoute } from "#/routes/__root";
import { renderAppRoute, renderRoute } from "#/test/test-utils";

describe("root route", () => {
  it("renders the not found page for unknown routes", async () => {
    await renderAppRoute("/does-not-exist");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  }, 15000);

  it("renders the route error component", () => {
    const errorComponent = RootRoute.options.errorComponent;

    if (!errorComponent) {
      throw new Error("Expected root route to define an error component");
    }

    return renderRoute({
      component: () =>
        errorComponent({
          error: new Error("Boom"),
          info: { componentStack: "" },
          reset: () => {},
        }),
      path: "/error",
      additionalRoutes: [{ path: "/" }],
    }).then(() => {
      expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
      expect(screen.getByText("Boom")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    });
  });
});
