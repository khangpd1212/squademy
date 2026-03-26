/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("POST /api/groups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies the request to NestJS /groups", async () => {
    const upstream = new NextResponse(
      JSON.stringify({
        ok: true,
        group: { id: "group-1", name: "IELTS Warriors", inviteCode: "abc123" },
      }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "IELTS Warriors", description: "" }),
    });

    const response = await POST(request);

    expect(proxyToApi).toHaveBeenCalledWith(request, "/groups");
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.group.name).toBe("IELTS Warriors");
  });
});
