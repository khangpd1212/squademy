/** @jest-environment node */

const getUserMock = jest.fn();
const groupsSelectMock = jest.fn();
const groupsEqMock = jest.fn();
const groupsMaybeSingleMock = jest.fn();
const membersSelectMock = jest.fn();
const membersEqGroupMock = jest.fn();
const membersEqUserMock = jest.fn();
const membersMaybeSingleMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === "groups") {
        return {
          select: groupsSelectMock,
        };
      }
      return {
        select: membersSelectMock,
      };
    },
  })),
}));

const adminInsertMock = jest.fn();

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: adminInsertMock,
    }),
  }),
}));

import { POST } from "./route";

describe("POST /api/groups/join", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    groupsSelectMock.mockReturnValue({ eq: groupsEqMock });
    groupsEqMock.mockReturnValue({ maybeSingle: groupsMaybeSingleMock });
    groupsMaybeSingleMock.mockResolvedValue({ data: null });

    membersSelectMock.mockReturnValue({ eq: membersEqGroupMock });
    membersEqGroupMock.mockReturnValue({ eq: membersEqUserMock });
    membersEqUserMock.mockReturnValue({ maybeSingle: membersMaybeSingleMock });
    membersMaybeSingleMock.mockResolvedValue({ data: null });

    adminInsertMock.mockResolvedValue({ error: null });
  });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const res = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: "abc123def456" }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 for invalid invite code", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    groupsMaybeSingleMock.mockResolvedValue({ data: null });

    const res = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: "invalid123" }),
      })
    );

    expect(res.status).toBe(404);
  });

  it("returns 200 if already a member (idempotent)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    groupsMaybeSingleMock.mockResolvedValue({ data: { id: "group-1" } });
    membersMaybeSingleMock.mockResolvedValue({ data: { group_id: "group-1" } });

    const res = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: "abc123def456" }),
      })
    );

    expect(res.status).toBe(200);
    expect(adminInsertMock).not.toHaveBeenCalled();
  });

  it("returns 201 and inserts member for valid invite code", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    groupsMaybeSingleMock.mockResolvedValue({ data: { id: "group-1" } });
    membersMaybeSingleMock.mockResolvedValue({ data: null });

    const res = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: "abc123def456" }),
      })
    );
    const payload = await res.json();

    expect(res.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.group.id).toBe("group-1");
    expect(adminInsertMock).toHaveBeenCalledWith({
      group_id: "group-1",
      user_id: "user-1",
      role: "member",
    });
  });
});
