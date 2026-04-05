import { AxiosError } from "axios";
import type { AxiosInstance } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const clearCredentials = vi.fn();
const getCredentials = vi.fn();
const toastError = vi.fn();

vi.mock("#/lib/auth", () => ({
  clearCredentials,
  getCredentials,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
  },
}));

function getRequestInterceptor(api: AxiosInstance) {
  const handlers = api.interceptors.request.handlers ?? [];
  const handler = handlers.find(entry => entry?.fulfilled)?.fulfilled;

  if (!handler) {
    throw new Error("Expected API request interceptor to be registered.");
  }

  return handler;
}

function getRejectedResponseInterceptor(api: AxiosInstance) {
  const handlers = api.interceptors.response.handlers ?? [];
  const handler = handlers.find(entry => entry?.rejected)?.rejected;

  if (!handler) {
    throw new Error("Expected API response interceptor to be registered.");
  }

  return handler;
}

describe("api client", () => {
  beforeEach(() => {
    vi.resetModules();
    clearCredentials.mockReset();
    getCredentials.mockReset();
    toastError.mockReset();
  });

  it("adds a Basic Authorization header when credentials are available", async () => {
    getCredentials.mockReturnValue("encoded-creds");
    const { api } = await import("#/lib/api");
    const intercept = getRequestInterceptor(api);

    const config = await intercept({
      headers: {} as InternalAxiosRequestConfig["headers"],
    } as InternalAxiosRequestConfig);

    expect(config.headers.Authorization).toBe("Basic encoded-creds");
  });

  it("leaves the request headers untouched when no credentials are stored", async () => {
    getCredentials.mockReturnValue(undefined);
    const { api } = await import("#/lib/api");
    const intercept = getRequestInterceptor(api);

    const config = await intercept({
      headers: {} as InternalAxiosRequestConfig["headers"],
    } as InternalAxiosRequestConfig);

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("shows a network toast when the response has no server payload", async () => {
    const { api } = await import("#/lib/api");
    const reject = getRejectedResponseInterceptor(api);
    const error = new AxiosError("Network failed");

    await expect(reject(error)).rejects.toBe(error);
    expect(toastError).toHaveBeenCalledWith("Network error. Please check your connection.");
    expect(clearCredentials).not.toHaveBeenCalled();
  });

  it("clears credentials and redirects on 401 responses", async () => {
    const originalLocation = window.location;
    let redirectedTo = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return redirectedTo || "http://localhost:3000/";
        },
        set href(value: string) {
          redirectedTo = value;
        },
      },
    });

    const { api } = await import("#/lib/api");
    const reject = getRejectedResponseInterceptor(api);
    const error = new AxiosError("Unauthorized");
    error.response = {
      data: {},
      headers: {},
      status: 401,
      statusText: "Unauthorized",
      config: {} as never,
    };

    await expect(reject(error)).rejects.toBe(error);

    expect(clearCredentials).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Invalid credentials. Please sign in again.");
    expect(redirectedTo).toBe("/login");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
