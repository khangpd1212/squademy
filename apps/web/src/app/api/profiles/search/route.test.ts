/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { GET } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("GET /api/profiles/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies to NestJS /users/search with encoded query", async () => {
    const upstream = new NextResponse(
      JSON.stringify({ profiles: [{ display_name: "Alice" }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest(
      "http://localhost/api/profiles/search?q=al&groupId=g1",
    );

    const res = await GET(request);

    expect(proxyToApi).toHaveBeenCalledWith(
      request,
      `/users/search?q=${encodeURIComponent("al")}`,
    );
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.profiles).toHaveLength(1);
  });
});
