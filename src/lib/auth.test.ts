import { clearCredentials, getCredentials, isAuthenticated, setCredentials } from "#/lib/auth";

describe("auth helpers", () => {
  it("stores credentials as a base64 cookie", () => {
    setCredentials("goledger", "secret");

    expect(getCredentials()).toBe("Z29sZWRnZXI6c2VjcmV0");
    expect(isAuthenticated()).toBe(true);
  });

  it("clears the stored credentials", () => {
    setCredentials("goledger", "secret");

    clearCredentials();

    expect(getCredentials()).toBeUndefined();
    expect(isAuthenticated()).toBe(false);
  });
});
