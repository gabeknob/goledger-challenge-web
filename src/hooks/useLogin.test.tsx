import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import { vi } from "vitest";

import { useLogin } from "#/hooks/useLogin";
import { setCredentials } from "#/lib/auth";
import { createTestQueryClient } from "#/test/test-utils";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("axios");

vi.mock("#/lib/auth", () => ({
  setCredentials: vi.fn(),
}));

vi.mock("#/lib/env", () => ({
  getEnv: () => "http://test-api",
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
  );
}

describe("useLogin", () => {
  it("sets credentials and navigates on successful API response", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.login({ username: "user", password: "pass" });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(axios.get).toHaveBeenCalledWith(
      "http://test-api/query/getHeader",
      expect.objectContaining({
        headers: { Authorization: `Basic ${btoa("user:pass")}` },
      }),
    );
    expect(setCredentials).toHaveBeenCalledWith("user", "pass");
    expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
  });

  it("exposes isError and does not set credentials on a failed API response", async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error("Unauthorized"));

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.login({ username: "user", password: "wrong" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(setCredentials).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
