import { registerSchema } from "./register-schema";

describe("registerSchema", () => {
  it("rejects password shorter than 6 chars", () => {
    const result = registerSchema.safeParse({
      displayName: "Test User",
      email: "user@example.com",
      password: "12345",
      acceptPrivacy: true,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["password"]);
  });

  it("accepts password with exactly 6 chars", () => {
    const result = registerSchema.safeParse({
      displayName: "Test User",
      email: "user@example.com",
      password: "123456",
      acceptPrivacy: true,
    });

    expect(result.success).toBe(true);
  });

  it("requires privacy consent", () => {
    const result = registerSchema.safeParse({
      displayName: "Test User",
      email: "user@example.com",
      password: "12345678",
      acceptPrivacy: false,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["acceptPrivacy"]);
  });
});
