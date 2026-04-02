import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
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
          status: "published",
          groupId: "group-1",
          updatedAt: new Date("2026-03-10"),
          group: { name: "IELTS Warriors" },
        },
        {
          id: "lesson-2",
          title: "Lesson B",
          status: "draft",
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
      status: "draft",
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
      status: "draft",
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
        status: "review",
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
        status: "published",
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
        status: "rejected",
      });
      prisma.lesson.update.mockResolvedValue({
        ...draftLesson,
        status: "rejected",
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
        status: "draft",
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
          status: "draft",
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
});
