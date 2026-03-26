/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

describe("/api/invitations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST proxies to NestJS /invitations", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true, id: "inv-1" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: "g1", inviteeId: "u2" }),
    });

    const res = await POST(request);

    expect(proxyToApi).toHaveBeenCalledWith(request, "/invitations");
    expect(res.status).toBe(201);
  });

  it("GET proxies to NestJS /invitations", async () => {
    const upstream = new NextResponse(JSON.stringify({ invitations: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/invitations");

    const res = await GET(request);

    expect(proxyToApi).toHaveBeenCalledWith(request, "/invitations");
    expect(res.status).toBe(200);
  });
});
