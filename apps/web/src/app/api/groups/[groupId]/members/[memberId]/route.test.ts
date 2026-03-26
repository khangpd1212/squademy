/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { DELETE } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

const params = Promise.resolve({ groupId: "group-1", memberId: "member-2" });

describe("DELETE /api/groups/[groupId]/members/[memberId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies to NestJS /groups/:groupId/members/:memberId", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest(
      "http://localhost/api/groups/group-1/members/member-2",
      { method: "DELETE" },
    );

    const res = await DELETE(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(
      request,
      "/groups/group-1/members/member-2",
    );
    expect(res.status).toBe(200);
  });
});
