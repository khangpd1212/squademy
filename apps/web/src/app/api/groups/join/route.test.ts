/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("POST /api/groups/join", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies the request to NestJS /groups/join", async () => {
    const upstream = new NextResponse(
      JSON.stringify({ ok: true, group: { id: "group-1" } }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: "abc123def456" }),
    });

    const response = await POST(request);

    expect(proxyToApi).toHaveBeenCalledWith(request, "/groups/join");
    expect(response.status).toBe(201);
  });
});
