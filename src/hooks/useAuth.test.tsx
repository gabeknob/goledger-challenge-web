import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useAuth } from "#/hooks/useAuth";
import { clearCredentials } from "#/lib/auth";
import { queryClient } from "#/lib/queryClient";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("#/lib/auth", () => ({
  clearCredentials: vi.fn(),
}));

describe("useAuth", () => {
  it("logs the user out and redirects to login", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAuth());

    result.current.logout();

    expect(clearCredentials).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith({ to: "/login" });
  });
});
