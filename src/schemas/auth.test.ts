import { loginSchema } from "#/schemas/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ username: "goledger", password: "secret" });

    expect(result.success).toBe(true);
  });

  it("requires both fields", () => {
    const result = loginSchema.safeParse({ username: "", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toEqual({
      password: ["Password is required"],
      username: ["Username is required"],
    });
  });
});
