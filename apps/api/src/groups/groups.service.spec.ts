import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { GroupsService } from "./groups.service";

describe("GroupsService.deleteGroup", () => {
  let service: GroupsService;
  let prisma: {
    $transaction: jest.Mock;
  };
  let tx: {
    group: { updateMany: jest.Mock };
    lesson: { updateMany: jest.Mock };
    exercise: { updateMany: jest.Mock };
    groupInvitation: { deleteMany: jest.Mock };
    groupMember: { updateMany: jest.Mock };
  };

  beforeEach(() => {
    tx = {
      group: { updateMany: jest.fn() },
      lesson: { updateMany: jest.fn() },
      exercise: { updateMany: jest.fn() },
      groupInvitation: { deleteMany: jest.fn() },
      groupMember: { updateMany: jest.fn() },
    };

    prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };

    service = new GroupsService(prisma as unknown as PrismaService);
  });

  it("soft-deletes the group content and memberships/invitations", async () => {
    tx.group.updateMany.mockResolvedValue({ count: 1 });
    tx.lesson.updateMany.mockResolvedValue({ count: 2 });
    tx.exercise.updateMany.mockResolvedValue({ count: 3 });
    tx.groupInvitation.deleteMany.mockResolvedValue({ count: 4 });
    tx.groupMember.updateMany.mockResolvedValue({ count: 5 });

    await service.deleteGroup("group-1");

    expect(tx.group.updateMany).toHaveBeenCalledWith({
      where: {
        id: "group-1",
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });
    expect(tx.lesson.updateMany).toHaveBeenCalledWith({
      where: { groupId: "group-1" },
      data: { isDeleted: true },
    });
    expect(tx.exercise.updateMany).toHaveBeenCalledWith({
      where: { groupId: "group-1" },
      data: { isDeleted: true },
    });
    expect(tx.groupInvitation.deleteMany).toHaveBeenCalledWith({
      where: { groupId: "group-1" },
    });
    expect(tx.groupMember.updateMany).toHaveBeenCalledWith({
      where: { groupId: "group-1", isDeleted: false },
      data: { isDeleted: true },
    });
  });

  it("throws not found when the group is already deleted or missing", async () => {
    tx.group.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.deleteGroup("group-1")).rejects.toThrow(NotFoundException);
    await expect(service.deleteGroup("group-1")).rejects.toMatchObject({
      response: { code: ErrorCode.GROUP_NOT_FOUND },
    });
  });

  it("throws GROUP_DELETE_FAILED when the transaction fails", async () => {
    tx.group.updateMany.mockResolvedValue({ count: 1 });
    tx.lesson.updateMany.mockRejectedValue(new Error("db blew up"));

    await expect(service.deleteGroup("group-1")).rejects.toThrow(BadRequestException);
    await expect(service.deleteGroup("group-1")).rejects.toMatchObject({
      response: { code: ErrorCode.GROUP_DELETE_FAILED },
    });
  });
});
