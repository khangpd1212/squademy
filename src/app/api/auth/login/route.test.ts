/** @jest-environment node */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { POST } from "./route";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("POST /api/auth/login", () => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldAnon;
  });

  it("returns validated redirect target from query", async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    });

    const request = new NextRequest(
      "https://squademy.app/api/auth/login?redirect=%2Fgroup%2Fg-1%2Fexercises",
      {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "12345678",
        }),
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      redirectTo: "/group/g-1/exercises",
    });
  });

  it("falls back to /dashboard for unsafe redirect values", async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    });

    const request = new NextRequest(
      "https://squademy.app/api/auth/login?redirect=https://evil.test",
      {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "12345678",
        }),
      }
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.redirectTo).toBe("/dashboard");
  });

  it("normalizes invalid credentials errors to story copy", async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          error: { code: "invalid_credentials", message: "bad credentials" },
        }),
      },
    });

    const request = new NextRequest("https://squademy.app/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "wrong-password",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.message).toBe("Invalid email or password.");
  });
});
