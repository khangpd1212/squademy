/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { PATCH } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies the request to NestJS /users/me", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const response = await PATCH(
      new NextRequest("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Tina" }),
      }),
    );

    expect(proxyToApi).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "/users/me",
    );
    expect(response.status).toBe(200);
  });
});
