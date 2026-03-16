/** @jest-environment node */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "./middleware";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("updateSession", () => {
  it("redirects unauthenticated protected requests to login with redirect param", async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const request = new NextRequest(
      "https://squademy.app/group/g-1/exercises?tab=all"
    );
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://squademy.app/login?redirect=%2Fgroup%2Fg-1%2Fexercises%3Ftab%3Dall"
    );
  });

  it("does not redirect public auth route", async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const request = new NextRequest("https://squademy.app/login");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });
});
