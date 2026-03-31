import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { GROUP_ROLES } from "@squademy/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { GroupAdminGuard } from "./group-admin.guard";

function createExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe("GroupAdminGuard", () => {
  let guard: GroupAdminGuard;
  let prisma: {
    groupMember: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      groupMember: {
        findUnique: jest.fn(),
      },
    };

    guard = new GroupAdminGuard(prisma as unknown as PrismaService);
  });

  it("allows access for group admins", async () => {
    prisma.groupMember.findUnique.mockResolvedValue({
      groupId: "group-1",
      userId: "user-1",
      role: GROUP_ROLES.ADMIN,
      isDeleted: false,
    });

    const request = {
      user: { userId: "user-1" },
      params: { id: "group-1" },
    };

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);
    expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: "group-1", userId: "user-1" } },
    });
  });

  it("rejects soft-deleted memberships with 403", async () => {
    prisma.groupMember.findUnique.mockResolvedValue({
      groupId: "group-1",
      userId: "user-1",
      role: GROUP_ROLES.ADMIN,
      isDeleted: true,
    });

    const request = {
      user: { userId: "user-1" },
      params: { id: "group-1" },
    };

    await expect(guard.canActivate(createExecutionContext(request))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("rejects non-admin members with 403", async () => {
    prisma.groupMember.findUnique.mockResolvedValue({
      groupId: "group-1",
      userId: "user-1",
      role: GROUP_ROLES.MEMBER,
      isDeleted: false,
    });

    const request = {
      user: { userId: "user-1" },
      params: { id: "group-1" },
    };

    await expect(guard.canActivate(createExecutionContext(request))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("rejects requests missing auth or group context", async () => {
    const request = {
      user: undefined,
      params: {},
    };

    await expect(guard.canActivate(createExecutionContext(request))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.groupMember.findUnique).not.toHaveBeenCalled();
  });
});
