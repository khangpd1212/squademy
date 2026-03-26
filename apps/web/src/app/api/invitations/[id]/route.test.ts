/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { PATCH } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

const params = Promise.resolve({ id: "inv-1" });

describe("PATCH /api/invitations/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies to NestJS /invitations/:id", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest("http://localhost/api/invitations/inv-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });

    const res = await PATCH(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(request, "/invitations/inv-1");
    expect(res.status).toBe(200);
  });
});
