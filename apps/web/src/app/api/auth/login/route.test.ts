/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies the request to NestJS /auth/login", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true, data: {} }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("https://squademy.app/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "12345678",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(proxyToApi).toHaveBeenCalledWith(request, "/auth/login");
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
  });
});
