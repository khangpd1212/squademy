/** @jest-environment node */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { POST } from "./route";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("POST /api/auth/logout", () => {
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

  it("signs out and redirects user to /login", async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        signOut,
      },
    });

    const request = new NextRequest("https://squademy.app/api/auth/logout", {
      method: "POST",
    });
    const response = await POST(request);

    expect(signOut).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://squademy.app/login");
  });

  it("returns 500 when Supabase signOut fails", async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: { message: "boom" } }),
      },
    });

    const request = new NextRequest("https://squademy.app/api/auth/logout", {
      method: "POST",
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.message).toBe("Logout failed. Please try again.");
  });
});
