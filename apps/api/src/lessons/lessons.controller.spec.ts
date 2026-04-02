import "reflect-metadata";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { LessonsController } from "./lessons.controller";
import type { LessonsService } from "./lessons.service";

describe("LessonsController", () => {
  it("has JwtAuthGuard applied at controller level", () => {
    const guards = Reflect.getMetadata("__guards__", LessonsController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  let controller: LessonsController;
  let lessonsService: jest.Mocked<LessonsService>;

  const mockUser = { userId: "user-1", email: "user@test.com" };

  beforeEach(() => {
    lessonsService = {
      findAllByAuthor: jest.fn(),
      findOneById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<LessonsService>;

    controller = new LessonsController(lessonsService);
  });

  describe("GET /lessons (findMyLessons)", () => {
    it("returns list of user lessons", async () => {
      const mockLessons = [
        {
          id: "lesson-1",
          title: "My First Lesson",
          status: "draft",
          groupId: "group-1",
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
          group: { name: "IELTS Warriors" },
        },
      ];
      lessonsService.findAllByAuthor.mockResolvedValue(mockLessons);

      const result = await controller.findMyLessons(mockUser);

      expect(lessonsService.findAllByAuthor).toHaveBeenCalledWith("user-1");
      expect(result).toEqual({ ok: true, data: mockLessons });
    });

    it("returns empty list when user has no lessons", async () => {
      lessonsService.findAllByAuthor.mockResolvedValue([]);

      const result = await controller.findMyLessons(mockUser);

      expect(result).toEqual({ ok: true, data: [] });
    });

    it("propagates service errors", async () => {
      lessonsService.findAllByAuthor.mockRejectedValue(
        new Error("DB connection lost"),
      );

      await expect(controller.findMyLessons(mockUser)).rejects.toThrow(
        "DB connection lost",
      );
    });
  });

  describe("GET /lessons/:id (findOne)", () => {
    it("returns lesson data when author matches", async () => {
      const mockLesson = {
        id: "lesson-1",
        title: "My Lesson",
        content: { type: "doc", content: [] },
        contentMarkdown: "some text",
        status: "draft",
        groupId: "group-1",
        authorId: "user-1",
        updatedAt: new Date("2026-04-01"),
      };
      lessonsService.findOneById.mockResolvedValue(mockLesson);

      const result = await controller.findOne("lesson-1", mockUser);

      expect(lessonsService.findOneById).toHaveBeenCalledWith("lesson-1", "user-1");
      expect(result).toEqual({ ok: true, data: mockLesson });
    });

    it("propagates NotFoundException from service", async () => {
      const { NotFoundException } = await import("@nestjs/common");
      lessonsService.findOneById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne("lesson-x", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("PATCH /lessons/:id (update)", () => {
    it("updates lesson and returns data", async () => {
      const updatedLesson = {
        id: "lesson-1",
        title: "Updated Title",
        content: { type: "doc", content: [] },
        contentMarkdown: "updated text",
        status: "draft",
        groupId: "group-1",
        authorId: "user-1",
        updatedAt: new Date("2026-04-01"),
      };
      lessonsService.update.mockResolvedValue(updatedLesson);

      const result = await controller.update("lesson-1", mockUser, {
        title: "Updated Title",
        contentMarkdown: "updated text",
      });

      expect(lessonsService.update).toHaveBeenCalledWith("lesson-1", "user-1", {
        title: "Updated Title",
        contentMarkdown: "updated text",
      });
      expect(result).toEqual({ ok: true, data: updatedLesson });
    });

    it("propagates ForbiddenException when lesson is in review", async () => {
      const { ForbiddenException } = await import("@nestjs/common");
      lessonsService.update.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update("lesson-1", mockUser, { title: "x" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("POST /lessons (create)", () => {
    it("creates lesson and returns data", async () => {
      const mockLesson = {
        id: "lesson-new",
        title: "Untitled Lesson",
        status: "draft",
        groupId: "group-1",
      };
      lessonsService.create.mockResolvedValue(mockLesson);

      const result = await controller.create(mockUser, { groupId: "group-1" });

      expect(lessonsService.create).toHaveBeenCalledWith("user-1", "group-1");
      expect(result).toEqual({ ok: true, data: mockLesson });
    });

    it("propagates service error when user is not a member", async () => {
      const { ForbiddenException } = await import("@nestjs/common");
      lessonsService.create.mockRejectedValue(
        new ForbiddenException("Not a member"),
      );

      await expect(
        controller.create(mockUser, { groupId: "group-99" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
