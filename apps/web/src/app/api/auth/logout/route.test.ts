/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies the request to NestJS /auth/logout", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("https://squademy.app/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);

    expect(proxyToApi).toHaveBeenCalledWith(request, "/auth/logout");
    expect(response.status).toBe(200);
  });
});
