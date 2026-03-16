/** @jest-environment node */

const getUserMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
}));

const adminSelectMock = jest.fn();
const adminSelectEqMock = jest.fn();
const adminMaybeSingleMock = jest.fn();
const adminInsertMock = jest.fn();
const adminUpdateMock = jest.fn();
const adminUpdateEqMock = jest.fn();

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "group_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: adminMaybeSingleMock,
              }),
            }),
          }),
          insert: adminInsertMock,
        };
      }
      return {
        select: adminSelectMock,
        update: adminUpdateMock,
      };
    },
  }),
}));

import { PATCH } from "./route";

describe("PATCH /api/invitations/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    adminSelectMock.mockReturnValue({ eq: adminSelectEqMock });
    adminSelectEqMock.mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({
      data: {
        id: "inv-1",
        group_id: "g1",
        invitee_id: "u1",
        status: "pending",
      },
    }) });

    adminMaybeSingleMock.mockResolvedValue({ data: null });
    adminInsertMock.mockResolvedValue({ error: null });

    adminUpdateMock.mockReturnValue({ eq: adminUpdateEqMock });
    adminUpdateEqMock.mockResolvedValue({ error: null });
  });

  const makeRequest = (action: string) =>
    PATCH(
      new Request("http://localhost/api/invitations/inv-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
      { params: Promise.resolve({ id: "inv-1" }) }
    );

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await makeRequest("accept");
    expect(res.status).toBe(401);
  });

  it("returns 404 when invitation not found", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    adminSelectEqMock.mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    });
    const res = await makeRequest("accept");
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the invitee", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u999" } } });
    const res = await makeRequest("accept");
    expect(res.status).toBe(403);
  });

  it("returns 200 and creates membership on accept", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await makeRequest("accept");
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.groupId).toBe("g1");
    expect(adminInsertMock).toHaveBeenCalledWith({
      group_id: "g1",
      user_id: "u1",
      role: "member",
    });
  });

  it("returns 200 on decline without creating membership", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await makeRequest("decline");
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(adminInsertMock).not.toHaveBeenCalled();
  });

  it("returns 500 when accept update fails", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    adminUpdateEqMock.mockResolvedValue({ error: { message: "DB error" } });
    const res = await makeRequest("accept");
    expect(res.status).toBe(500);
  });

  it("returns 500 when decline update fails", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    adminUpdateEqMock.mockResolvedValue({ error: { message: "DB error" } });
    const res = await makeRequest("decline");
    expect(res.status).toBe(500);
  });

  it("returns 409 when invitation already processed", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    adminSelectEqMock.mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "inv-1", group_id: "g1", invitee_id: "u1", status: "accepted" },
      }),
    });
    const res = await makeRequest("accept");
    expect(res.status).toBe(409);
  });
});
