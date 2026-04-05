import { AxiosError } from "axios";

import { getApiErrorMessage } from "#/lib/api-errors";

describe("getApiErrorMessage", () => {
  it("prefers the API payload message when available", () => {
    const error = new AxiosError("Request failed");
    error.response = {
      data: {
        error: "fallback error",
        message: "Readable API message",
      },
      headers: {},
      status: 400,
      statusText: "Bad Request",
      config: {} as never,
    };

    expect(getApiErrorMessage(error, "Fallback message")).toBe("Readable API message");
  });

  it("falls back to the API payload error field", () => {
    const error = new AxiosError("Request failed");
    error.response = {
      data: {
        error: "Validation failed",
      },
      headers: {},
      status: 400,
      statusText: "Bad Request",
      config: {} as never,
    };

    expect(getApiErrorMessage(error, "Fallback message")).toBe("Validation failed");
  });

  it("uses the fallback when the Axios payload has neither message nor error", () => {
    const error = new AxiosError("Request failed");
    error.response = {
      data: {},
      headers: {},
      status: 400,
      statusText: "Bad Request",
      config: {} as never,
    };

    expect(getApiErrorMessage(error, "Fallback message")).toBe("Fallback message");
  });

  it("returns the Error message for plain Error instances", () => {
    expect(getApiErrorMessage(new Error("Boom"), "Fallback message")).toBe("Boom");
  });

  it("uses the fallback when no other message is available", () => {
    expect(getApiErrorMessage("unexpected", "Fallback message")).toBe("Fallback message");
  });
});
