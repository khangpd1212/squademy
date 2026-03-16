import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "./client";

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(),
}));

describe("createClient", () => {
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

  it("creates browser client with expected env vars", () => {
    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
  });
});
