/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { DELETE, POST } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

const params = Promise.resolve({ groupId: "g1" });

describe("/api/groups/[groupId]/invite-link", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST proxies to NestJS invite-link", async () => {
    const upstream = new NextResponse(
      JSON.stringify({ ok: true, inviteCode: "newcode" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest(
      "http://localhost/api/groups/g1/invite-link",
      { method: "POST" },
    );

    const res = await POST(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(request, "/groups/g1/invite-link");
    expect(res.status).toBe(200);
  });

  it("DELETE proxies as POST to NestJS invite-link", async () => {
    const upstream = new NextResponse(
      JSON.stringify({ ok: true, inviteCode: "newcode" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest(
      "http://localhost/api/groups/g1/invite-link",
      { method: "DELETE" },
    );

    const res = await DELETE(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(request, "/groups/g1/invite-link", {
      method: "POST",
    });
    expect(res.status).toBe(200);
  });
});
