import "@testing-library/jest-dom";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

import { clearCredentials } from "#/lib/auth";
import { queryClient } from "#/lib/queryClient";
import { installBrowserMocks, resetBrowserMocks } from "#/test/browser-mocks";

const mockedToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  message: vi.fn(),
};

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: mockedToast,
}));

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}));

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtoolsPanel: () => null,
}));

beforeAll(() => {
  // React 19 expects this flag for async act() coordination in tests.
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  installBrowserMocks();
});

afterEach(() => {
  cleanup();
  clearCredentials();
  queryClient.clear();
  resetBrowserMocks();
  vi.clearAllMocks();
});
