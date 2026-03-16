/** @jest-environment node */

const getUserMock = jest.fn();
const membersSelectMock = jest.fn();
const membersEqGroupMock = jest.fn();
const membersEqUserMock = jest.fn();
const membersMaybeSingleMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: membersSelectMock,
    }),
  })),
}));

const adminInvitationsSelectMock = jest.fn();
const adminInvitationsEqGroupMock = jest.fn();
const adminInvitationsEqInviteeMock = jest.fn();
const adminInvitationsEqStatusMock = jest.fn();
const adminInvitationsMaybeSingleMock = jest.fn();
const adminInsertMock = jest.fn();
const adminInsertSelectMock = jest.fn();
const adminInsertSingleMock = jest.fn();

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: adminInvitationsSelectMock,
      insert: adminInsertMock,
    }),
  }),
}));

import { POST } from "./route";

describe("POST /api/invitations", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    membersSelectMock.mockReturnValue({ eq: membersEqGroupMock });
    membersEqGroupMock.mockReturnValue({ eq: membersEqUserMock });
    membersEqUserMock.mockReturnValue({ maybeSingle: membersMaybeSingleMock });

    adminInvitationsSelectMock.mockReturnValue({ eq: adminInvitationsEqGroupMock });
    adminInvitationsEqGroupMock.mockReturnValue({ eq: adminInvitationsEqInviteeMock });
    adminInvitationsEqInviteeMock.mockReturnValue({ eq: adminInvitationsEqStatusMock });
    adminInvitationsEqStatusMock.mockReturnValue({ maybeSingle: adminInvitationsMaybeSingleMock });
    adminInvitationsMaybeSingleMock.mockResolvedValue({ data: null });

    adminInsertMock.mockReturnValue({ select: adminInsertSelectMock });
    adminInsertSelectMock.mockReturnValue({ single: adminInsertSingleMock });
    adminInsertSingleMock.mockResolvedValue({
      data: { id: "inv-1" },
      error: null,
    });
  });

  const makeRequest = (body: Record<string, string>) =>
    POST(
      new Request("http://localhost/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    );

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await makeRequest({ groupId: "g1", inviteeId: "u2" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    membersMaybeSingleMock.mockResolvedValue({ data: { role: "member" } });
    const res = await makeRequest({ groupId: "g1", inviteeId: "u2" });
    expect(res.status).toBe(403);
  });

  it("returns 409 if invitee is already a member", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    membersMaybeSingleMock
      .mockResolvedValueOnce({ data: { role: "admin" } })
      .mockResolvedValueOnce({ data: { group_id: "g1" } });
    const res = await makeRequest({ groupId: "g1", inviteeId: "u2" });
    expect(res.status).toBe(409);
  });

  it("returns 201 for valid invitation", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    membersMaybeSingleMock
      .mockResolvedValueOnce({ data: { role: "admin" } })
      .mockResolvedValueOnce({ data: null });

    const res = await makeRequest({ groupId: "g1", inviteeId: "u2" });
    const payload = await res.json();

    expect(res.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.invitation.id).toBe("inv-1");
  });
});
