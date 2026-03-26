import { loginSchema } from "./login-schema";

describe("loginSchema", () => {
  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "12345678",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["email"]);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["password"]);
  });

  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "123456",
    });

    expect(result.success).toBe(true);
  });
});
