/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { PATCH } from "./route";
import { proxyToApi } from "@/lib/api/proxy";

jest.mock("@/lib/api/proxy", () => ({
  proxyToApi: jest.fn(),
}));

const params = Promise.resolve({ groupId: "group-1", memberId: "member-2" });

describe("PATCH /api/groups/[groupId]/members/[memberId]/role", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("proxies to NestJS role endpoint", async () => {
    const upstream = new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    (proxyToApi as jest.Mock).mockResolvedValue(upstream);

    const request = new NextRequest(
      "http://localhost/api/groups/group-1/members/member-2/role",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "editor" }),
      },
    );

    const res = await PATCH(request, { params });

    expect(proxyToApi).toHaveBeenCalledWith(
      request,
      "/groups/group-1/members/member-2/role",
    );
    expect(res.status).toBe(200);
  });
});
