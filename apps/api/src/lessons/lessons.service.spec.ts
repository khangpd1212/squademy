import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, LESSON_STATUS } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { LessonsService } from "./lessons.service";

describe("LessonsService", () => {
  let service: LessonsService;
  let prisma: {
    lesson: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    groupMember: {
      findFirst: jest.Mock;
    };
    group: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      lesson: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      groupMember: {
        findFirst: jest.fn(),
      },
      group: {
        findFirst: jest.fn(),
      },
    };

    service = new LessonsService(prisma as unknown as PrismaService);
  });

  describe("findAllByAuthor", () => {
    it("returns filtered and ordered lessons for the author", async () => {
      const mockLessons = [
        {
          id: "lesson-1",
          title: "Lesson A",
          status: LESSON_STATUS.PUBLISHED,
          groupId: "group-1",
          updatedAt: new Date("2026-03-10"),
          group: { name: "IELTS Warriors" },
        },
        {
          id: "lesson-2",
          title: "Lesson B",
          status: LESSON_STATUS.DRAFT,
          groupId: "group-1",
          updatedAt: new Date("2026-03-05"),
          group: { name: "IELTS Warriors" },
        },
      ];
      prisma.lesson.findMany.mockResolvedValue(mockLessons);

      const result = await service.findAllByAuthor("user-1");

      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: {
          authorId: "user-1",
          isDeleted: false,
          group: { isDeleted: false },
        },
        select: {
          id: true,
          title: true,
          status: true,
          groupId: true,
          updatedAt: true,
          group: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toEqual(mockLessons);
    });

    it("returns empty array when user has no lessons", async () => {
      prisma.lesson.findMany.mockResolvedValue([]);

      const result = await service.findAllByAuthor("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("findOneById", () => {
    const mockLesson = {
      id: "lesson-1",
      title: "My Lesson",
      content: { type: "doc", content: [] },
      contentMarkdown: "some text",
      status: LESSON_STATUS.DRAFT,
      groupId: "group-1",
      authorId: "user-1",
      updatedAt: new Date("2026-04-01"),
      isDeleted: false,
    };

    it("returns lesson when author matches", async () => {
      prisma.lesson.findFirst.mockResolvedValue(mockLesson);

      const result = await service.findOneById("lesson-1", "user-1");

      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { id: "lesson-1", isDeleted: false },
      });
      expect(result).toMatchObject({
        id: "lesson-1",
        title: "My Lesson",
        groupId: "group-1",
        authorId: "user-1",
      });
    });

    it("throws NotFoundException when lesson does not exist", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.findOneById("lesson-x", "user-1")).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.findOneById("lesson-x", "user-1"),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_NOT_FOUND },
      });
    });

    it("throws ForbiddenException when user is not the author", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...mockLesson,
        authorId: "user-2",
      });

      await expect(service.findOneById("lesson-1", "user-1")).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.findOneById("lesson-1", "user-1"),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_NOT_OWNER },
      });
    });
  });

  describe("update", () => {
    const draftLesson = {
      id: "lesson-1",
      title: "My Lesson",
      content: null,
      contentMarkdown: null,
      status: LESSON_STATUS.DRAFT,
      groupId: "group-1",
      authorId: "user-1",
      updatedAt: new Date("2026-04-01"),
      isDeleted: false,
    };

    it("updates title, content, contentMarkdown", async () => {
      prisma.lesson.findFirst.mockResolvedValue(draftLesson);
      const updatedLesson = {
        ...draftLesson,
        title: "New Title",
        contentMarkdown: "new text",
      };
      prisma.lesson.update.mockResolvedValue(updatedLesson);

      const result = await service.update("lesson-1", "user-1", {
        title: "New Title",
        contentMarkdown: "new text",
      });

      expect(prisma.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "lesson-1" },
          data: expect.objectContaining({ title: "New Title" }),
        }),
      );
      expect(result).toMatchObject({ title: "New Title" });
    });

    it("throws ForbiddenException when user is not the author", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...draftLesson,
        authorId: "user-2",
      });

      await expect(service.update("lesson-1", "user-1", {})).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.update("lesson-1", "user-1", {}),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_NOT_OWNER },
      });
    });

    it("throws ForbiddenException when lesson status is review", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...draftLesson,
        status: LESSON_STATUS.REVIEW,
      });

      await expect(service.update("lesson-1", "user-1", {})).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.update("lesson-1", "user-1", {}),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_NOT_EDITABLE },
      });
    });

    it("throws ForbiddenException when lesson status is published", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...draftLesson,
        status: LESSON_STATUS.PUBLISHED,
      });

      await expect(service.update("lesson-1", "user-1", {})).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.update("lesson-1", "user-1", {}),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_NOT_EDITABLE },
      });
    });

    it("allows update when status is rejected", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...draftLesson,
        status: LESSON_STATUS.REJECTED,
      });
      prisma.lesson.update.mockResolvedValue({
        ...draftLesson,
        status: LESSON_STATUS.REJECTED,
        title: "Fixed",
      });

      await expect(
        service.update("lesson-1", "user-1", { title: "Fixed" }),
      ).resolves.toBeDefined();
    });

    it("throws NotFoundException when lesson does not exist", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.update("lesson-x", "user-1", {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("creates a draft lesson with placeholder title", async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: "group-1",
        isDeleted: false,
      });
      prisma.groupMember.findFirst.mockResolvedValue({
        userId: "user-1",
        groupId: "group-1",
        isDeleted: false,
      });
      const mockLesson = {
        id: "lesson-new",
        title: "Untitled Lesson",
        status: LESSON_STATUS.DRAFT,
        groupId: "group-1",
      };
      prisma.lesson.create.mockResolvedValue(mockLesson);

      const result = await service.create("user-1", "group-1");

      expect(prisma.group.findFirst).toHaveBeenCalledWith({
        where: { id: "group-1", isDeleted: false },
      });
      expect(prisma.groupMember.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1", groupId: "group-1", isDeleted: false },
      });
      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: {
          authorId: "user-1",
          groupId: "group-1",
          title: "Untitled Lesson",
          status: LESSON_STATUS.DRAFT,
        },
        select: { id: true, title: true, status: true, groupId: true },
      });
      expect(result).toEqual(mockLesson);
    });

    it("throws NotFoundException when group is soft-deleted or missing", async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(service.create("user-1", "group-1")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create("user-1", "group-1")).rejects.toMatchObject({
        response: { code: ErrorCode.GROUP_NOT_FOUND },
      });
      expect(prisma.groupMember.findFirst).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when user is not an active member", async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: "group-1",
        isDeleted: false,
      });
      prisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.create("user-1", "group-1")).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create("user-1", "group-1")).rejects.toMatchObject({
        response: { code: ErrorCode.FORBIDDEN_NOT_MEMBER },
      });
    });

    it("throws ForbiddenException for soft-deleted membership", async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: "group-1",
        isDeleted: false,
      });
      prisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.create("user-1", "group-1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws BadRequestException with LESSON_CREATE_FAILED when prisma create fails", async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: "group-1",
        isDeleted: false,
      });
      prisma.groupMember.findFirst.mockResolvedValue({
        userId: "user-1",
        groupId: "group-1",
        isDeleted: false,
      });
      prisma.lesson.create.mockRejectedValue(new Error("DB constraint"));

      await expect(service.create("user-1", "group-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create("user-1", "group-1")).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_CREATE_FAILED },
      });
    });
  });

  describe("submit", () => {
    const draftLesson = {
      id: "lesson-1",
      title: "My Lesson",
      content: null,
      contentMarkdown: null,
      status: LESSON_STATUS.DRAFT,
      groupId: "group-1",
      authorId: "user-1",
      updatedAt: new Date("2026-04-01"),
      isDeleted: false,
    };

    it("updates status from draft to review", async () => {
      prisma.lesson.findFirst.mockResolvedValue(draftLesson);
      const updatedLesson = { ...draftLesson, status: LESSON_STATUS.REVIEW };
      prisma.lesson.update.mockResolvedValue(updatedLesson);

      const result = await service.submit("lesson-1");

      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { id: "lesson-1", isDeleted: false },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        data: { status: LESSON_STATUS.REVIEW },
        select: expect.any(Object),
      });
      expect(result.status).toBe(LESSON_STATUS.REVIEW);
    });
  });

  describe("getReactions", () => {
    let prismaWithReactions: {
      lesson: { findFirst: jest.Mock };
      lessonReaction: { findMany: jest.Mock; findFirst: jest.Mock };
    };

    beforeEach(() => {
      prismaWithReactions = {
        lesson: { findFirst: jest.fn() },
        lessonReaction: { findMany: jest.fn(), findFirst: jest.fn() },
      };
      service = new LessonsService(prismaWithReactions as unknown as PrismaService);
    });

    it("returns grouped reactions with counts", async () => {
      prismaWithReactions.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      prismaWithReactions.lessonReaction.findMany.mockResolvedValue([
        { lineRef: "p1", reactionType: "thumbs_up" },
        { lineRef: "p1", reactionType: "thumbs_up" },
        { lineRef: "p1", reactionType: "heart" },
        { lineRef: "p2", reactionType: "thumbs_up" },
      ]);

      const result = await service.getReactions("lesson-1", "user-1");

      expect(result).toHaveLength(3);
      const p1ThumbsUp = result.find((r) => r.lineRef === "p1" && r.type === "thumbs_up");
      expect(p1ThumbsUp?.count).toBe(2);
      const p1Heart = result.find((r) => r.lineRef === "p1" && r.type === "heart");
      expect(p1Heart?.count).toBe(1);
      const p2ThumbsUp = result.find((r) => r.lineRef === "p2" && r.type === "thumbs_up");
      expect(p2ThumbsUp?.count).toBe(1);
    });

    it("throws NotFoundException when lesson not found", async () => {
      prismaWithReactions.lesson.findFirst.mockResolvedValue(null);

      await expect(service.getReactions("lesson-x", "user-1")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getReactions("lesson-x", "user-1")).rejects.toMatchObject({
        response: { code: ErrorCode.LESSON_NOT_FOUND },
      });
    });
  });

  describe("toggleReaction", () => {
    let prismaWithReaction: {
      lesson: { findFirst: jest.Mock };
      lessonReaction: { findFirst: jest.Mock; create: jest.Mock; delete: jest.Mock };
    };

    beforeEach(() => {
      prismaWithReaction = {
        lesson: { findFirst: jest.fn() },
        lessonReaction: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
      };
      service = new LessonsService(prismaWithReaction as unknown as PrismaService);
    });

    it("creates reaction when none exists", async () => {
      prismaWithReaction.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      prismaWithReaction.lessonReaction.findFirst.mockResolvedValue(null);
      prismaWithReaction.lessonReaction.create.mockResolvedValue({ id: "r-1" });

      const result = await service.toggleReaction("lesson-1", "user-1", {
        lineRef: "p1",
        reactionType: "thumbs_up" as const,
      });

      expect(prismaWithReaction.lessonReaction.create).toHaveBeenCalledWith({
        data: {
          lessonId: "lesson-1",
          userId: "user-1",
          lineRef: "p1",
          reactionType: "thumbs_up",
        },
      });
      expect(result.toggled).toBe(true);
    });

    it("deletes reaction when already exists (toggle)", async () => {
      prismaWithReaction.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      prismaWithReaction.lessonReaction.findFirst.mockResolvedValue({ id: "r-1" });

      const result = await service.toggleReaction("lesson-1", "user-1", {
        lineRef: "p1",
        reactionType: "thumbs_up" as const,
      });

      expect(prismaWithReaction.lessonReaction.delete).toHaveBeenCalledWith({
        where: { id: "r-1" },
      });
      expect(result.toggled).toBe(false);
    });

    it("throws REACTION_FAILED when create fails", async () => {
      prismaWithReaction.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      prismaWithReaction.lessonReaction.findFirst.mockResolvedValue(null);
      prismaWithReaction.lessonReaction.create.mockRejectedValue(new Error("DB error"));

      await expect(
        service.toggleReaction("lesson-1", "user-1", {
          lineRef: "p1",
          reactionType: "thumbs_up" as const,
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.REACTION_FAILED },
      });
    });
  });

  describe("recordInteraction", () => {
    let prismaWithInteraction: {
      lesson: { findFirst: jest.Mock };
      aliveTextInteraction: { upsert: jest.Mock };
    };

    beforeEach(() => {
      prismaWithInteraction = {
        lesson: { findFirst: jest.fn() },
        aliveTextInteraction: { upsert: jest.fn() },
      };
      service = new LessonsService(prismaWithInteraction as unknown as PrismaService);
    });

    it("creates alive text interaction", async () => {
      prismaWithInteraction.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      prismaWithInteraction.aliveTextInteraction.upsert.mockResolvedValue({ id: "i-1" });

      const result = await service.recordInteraction("lesson-1", "user-1", {
        blockId: "block-1",
        interactionType: "reveal" as const,
      });

      expect(prismaWithInteraction.aliveTextInteraction.upsert).toHaveBeenCalledWith({
        where: {
          lessonId_userId_blockId: {
            lessonId: "lesson-1",
            userId: "user-1",
            blockId: "block-1",
          },
        },
        update: { interactionType: "reveal" },
        create: {
          lessonId: "lesson-1",
          userId: "user-1",
          blockId: "block-1",
          interactionType: "reveal",
        },
      });
      expect(result).toEqual({ id: "i-1" });
    });
  });

  describe("updateProgress", () => {
    let prismaWithProgress: {
      lesson: { findFirst: jest.Mock };
      lessonProgress: { upsert: jest.Mock };
    };

    beforeEach(() => {
      prismaWithProgress = {
        lesson: { findFirst: jest.fn() },
        lessonProgress: { upsert: jest.fn() },
      };
      service = new LessonsService(prismaWithProgress as unknown as PrismaService);
    });

    it("marks lesson as read", async () => {
      prismaWithProgress.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      const now = new Date();
      prismaWithProgress.lessonProgress.upsert.mockResolvedValue({
        lessonId: "lesson-1",
        userId: "user-1",
        isRead: true,
        readAt: now,
      });

      const result = await service.updateProgress("lesson-1", "user-1", {
        isRead: true,
      });

      expect(prismaWithProgress.lessonProgress.upsert).toHaveBeenCalledWith({
        where: { lessonId_userId: { lessonId: "lesson-1", userId: "user-1" } },
        update: { isRead: true, readAt: expect.any(Date) },
        create: {
          lessonId: "lesson-1",
          userId: "user-1",
          isRead: true,
          readAt: expect.any(Date),
        },
      });
      expect(result.isRead).toBe(true);
    });

    it("throws PROGRESS_UPDATE_FAILED on error", async () => {
      prismaWithProgress.lesson.findFirst.mockResolvedValue({ id: "lesson-1" });
      prismaWithProgress.lessonProgress.upsert.mockRejectedValue(new Error("DB error"));

      await expect(
        service.updateProgress("lesson-1", "user-1", { isRead: true }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.PROGRESS_UPDATE_FAILED },
      });
    });
  });
});
