/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { GET, PATCH } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

const params = Promise.resolve({ groupId: "group-1" });

describe("/api/groups/[groupId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET proxies to NestJS /groups/:groupId", async () => {
    const upstream = new NextResponse(JSON.stringify({ id: "group-1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/groups/group-1");
    const response = await GET(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(request, "/groups/group-1");
    expect(response.status).toBe(200);
  });

  it("PATCH proxies to NestJS /groups/:groupId", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/groups/group-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await PATCH(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(request, "/groups/group-1");
    expect(response.status).toBe(200);
  });
});
