/** @jest-environment node */

jest.mock("nanoid", () => ({
  customAlphabet: () => () => "abc123def456",
}));

import { POST } from "./route";

const getUserMock = jest.fn();
const groupsInsertMock = jest.fn();
const groupsSelectMock = jest.fn();
const groupsSingleMock = jest.fn();
const groupMembersInsertMock = jest.fn();
const groupsDeleteMock = jest.fn();
const groupsDeleteEqMock = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: (table: "groups" | "group_members") => {
      if (table === "groups") {
        return {
          insert: groupsInsertMock,
          delete: groupsDeleteMock,
        };
      }

      return {
        insert: groupMembersInsertMock,
      };
    },
  })),
}));

describe("POST /api/groups", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    groupsInsertMock.mockReset();
    groupsSelectMock.mockReset();
    groupsSingleMock.mockReset();
    groupMembersInsertMock.mockReset();
    groupsDeleteMock.mockReset();
    groupsDeleteEqMock.mockReset();

    groupsDeleteMock.mockReturnValue({ eq: groupsDeleteEqMock });
    groupsDeleteEqMock.mockResolvedValue({ error: null });

    groupsInsertMock.mockReturnValue({ select: groupsSelectMock });
    groupsSelectMock.mockReturnValue({ single: groupsSingleMock });
    groupsSingleMock.mockResolvedValue({
      data: {
        id: "group-1",
        name: "IELTS Warriors",
        description: "Intensive prep",
        invite_code: "abc123def456",
        created_by: "user-1",
        created_at: "2026-03-15T00:00:00.000Z",
      },
      error: null,
    });

    groupMembersInsertMock.mockResolvedValue({ error: null });
  });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "IELTS Warriors", description: "" }),
      })
    );

    expect(response.status).toBe(401);
    expect(groupsInsertMock).not.toHaveBeenCalled();
  });

  it("returns 400 when group name is empty", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "   ", description: "" }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.field).toBe("name");
    expect(payload.message).toBe("Group name is required.");
    expect(groupsInsertMock).not.toHaveBeenCalled();
  });

  it("creates group and admin membership for authenticated user", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "IELTS Warriors",
          description: "Intensive prep",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.group).toMatchObject({
      id: "group-1",
      name: "IELTS Warriors",
      inviteCode: "abc123def456",
    });
    expect(groupsInsertMock).toHaveBeenCalledTimes(1);
    expect(groupMembersInsertMock).toHaveBeenCalledWith({
      group_id: "group-1",
      user_id: "user-1",
      role: "admin",
    });
  });

  it("retries on invite_code conflict and returns 201 on second attempt", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    groupsSingleMock
      .mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint invite_code" },
      })
      .mockResolvedValueOnce({
        data: {
          id: "group-1",
          name: "IELTS Warriors",
          description: null,
          invite_code: "abc123def456",
          created_by: "user-1",
          created_at: "2026-03-15T00:00:00.000Z",
        },
        error: null,
      });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "IELTS Warriors" }),
      })
    );

    expect(response.status).toBe(201);
    expect(groupsInsertMock).toHaveBeenCalledTimes(2);
  });

  it("returns 500 after exhausting all invite_code conflict retries", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    groupsSingleMock.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint invite_code" },
    });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "IELTS Warriors" }),
      })
    );

    expect(response.status).toBe(500);
    expect(groupsInsertMock).toHaveBeenCalledTimes(3);
  });

  it("deletes orphan group and returns 500 when group_members insert fails", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    groupMembersInsertMock.mockResolvedValue({ error: { message: "FK violation" } });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "IELTS Warriors" }),
      })
    );

    expect(response.status).toBe(500);
    expect(groupsDeleteEqMock).toHaveBeenCalledWith("id", "group-1");
  });

  it("returns 400 when request body is invalid JSON", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-valid-json{",
      })
    );

    expect(response.status).toBe(400);
    expect(groupsInsertMock).not.toHaveBeenCalled();
  });
});
