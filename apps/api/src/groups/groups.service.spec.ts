import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { GroupsService } from "./groups.service";

describe("GroupsService", () => {
  let service: GroupsService;

  describe("deleteGroup", () => {
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

  describe("getLearningPath", () => {
    let prismaWithLP: {
      group: { findFirst: jest.Mock };
      learningPathItem: { findMany: jest.Mock };
    };

    beforeEach(() => {
      prismaWithLP = {
        group: { findFirst: jest.fn() },
        learningPathItem: { findMany: jest.fn() },
      };
      service = new GroupsService(prismaWithLP as unknown as PrismaService);
    });

    it("returns learning path items ordered by sortOrder", async () => {
      prismaWithLP.group.findFirst.mockResolvedValue({ id: "group-1" });
      prismaWithLP.learningPathItem.findMany.mockResolvedValue([
        { id: "lp-1", sortOrder: 1, lesson: { id: "l-1", title: "Lesson 1" } },
        { id: "lp-2", sortOrder: 2, lesson: { id: "l-2", title: "Lesson 2" } },
      ]);

      const result = await service.getLearningPath("group-1");

      expect(prismaWithLP.learningPathItem.findMany).toHaveBeenCalledWith({
        where: { groupId: "group-1" },
        orderBy: { sortOrder: "asc" },
        include: {
          lesson: { where: { isDeleted: false, status: "published" }, select: { id: true, title: true, status: true } },
          deck: { select: { id: true, title: true } },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].lesson?.title).toBe("Lesson 1");
    });

    it("throws GROUP_NOT_FOUND when group does not exist", async () => {
      prismaWithLP.group.findFirst.mockResolvedValue(null);

      await expect(service.getLearningPath("group-x")).rejects.toThrow(NotFoundException);
      await expect(service.getLearningPath("group-x")).rejects.toMatchObject({
        response: { code: ErrorCode.GROUP_NOT_FOUND },
      });
    });
  });

  describe("addLearningPathItem", () => {
    let prismaWithLPAdd: {
      group: { findFirst: jest.Mock };
      learningPathItem: { findFirst: jest.Mock; create: jest.Mock };
    };

    beforeEach(() => {
      prismaWithLPAdd = {
        group: { findFirst: jest.fn() },
        learningPathItem: { findFirst: jest.fn(), create: jest.fn() },
      };
      service = new GroupsService(prismaWithLPAdd as unknown as PrismaService);
    });

    it("adds lesson to learning path with next sortOrder", async () => {
      prismaWithLPAdd.group.findFirst.mockResolvedValue({ id: "group-1" });
      prismaWithLPAdd.learningPathItem.findFirst
        .mockResolvedValueOnce(null)  // duplicate check - no existing item
        .mockResolvedValueOnce({ sortOrder: 2 });  // get last sortOrder
      prismaWithLPAdd.learningPathItem.create.mockResolvedValue({
        id: "lp-new",
        sortOrder: 3,
      });

      const result = await service.addLearningPathItem("group-1", { lessonId: "lesson-1" });

      expect(prismaWithLPAdd.learningPathItem.create).toHaveBeenCalledWith({
        data: {
          groupId: "group-1",
          lessonId: "lesson-1",
          deckId: null,
          sortOrder: 3,
        },
        include: {
          lesson: { select: { id: true, title: true, status: true } },
          deck: { select: { id: true, title: true } },
        },
      });
      expect(result.sortOrder).toBe(3);
    });

    it("throws error when neither lessonId nor deckId provided", async () => {
      prismaWithLPAdd.group.findFirst.mockResolvedValue({ id: "group-1" });

      await expect(service.addLearningPathItem("group-1", {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws error when item already exists in learning path", async () => {
      prismaWithLPAdd.group.findFirst.mockResolvedValue({ id: "group-1" });
      prismaWithLPAdd.learningPathItem.findFirst.mockResolvedValue({ id: "existing" });  // duplicate found

      await expect(
        service.addLearningPathItem("group-1", { lessonId: "lesson-1" }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.LEARNING_PATH_ITEM_EXISTS },
      });
    });
  });
});