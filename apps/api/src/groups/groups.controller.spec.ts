import "reflect-metadata";
import { GroupAdminGuard } from "../common/guards/group-admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GroupsController } from "./groups.controller";
import type { GroupsService } from "./groups.service";

describe("GroupsController", () => {
  it("has JwtAuthGuard applied at controller level", () => {
    const guards = Reflect.getMetadata("__guards__", GroupsController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  it("protects delete route with GroupAdminGuard", () => {
    const guards = Reflect.getMetadata(
      "__guards__",
      GroupsController.prototype.delete,
    );

    expect(guards).toBeDefined();
    expect(guards).toContain(GroupAdminGuard);
  });

  let controller: GroupsController;
  let groupsService: jest.Mocked<GroupsService>;

  beforeEach(() => {
    groupsService = {
      findMyGroups: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deleteGroup: jest.fn(),
      join: jest.fn(),
      regenerateInviteCode: jest.fn(),
    } as unknown as jest.Mocked<GroupsService>;

    controller = new GroupsController(groupsService);
  });

  it("returns my groups for authenticated user", async () => {
    groupsService.findMyGroups.mockResolvedValue([
      {
        id: "group-1",
        name: "IELTS Warriors",
        description: "Desc",
        role: "admin",
        memberCount: 3,
        createdAt: "2026-03-30T00:00:00.000Z",
      },
    ]);

    const result = await controller.findMine({
      userId: "user-1",
      email: "u@e.com",
    });

    expect(groupsService.findMyGroups).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: "group-1",
          name: "IELTS Warriors",
          description: "Desc",
          role: "admin",
          memberCount: 3,
          createdAt: "2026-03-30T00:00:00.000Z",
        },
      ],
    });
  });

  it("returns an empty list when user has no groups", async () => {
    groupsService.findMyGroups.mockResolvedValue([]);

    const result = await controller.findMine({
      userId: "user-2",
      email: "u2@e.com",
    });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("propagates service errors (e.g. DB failure)", async () => {
    groupsService.findMyGroups.mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(
      controller.findMine({ userId: "user-1", email: "u@e.com" }),
    ).rejects.toThrow("DB connection lost");
  });

  describe("update (PATCH :id)", () => {
    const updatedGroup = {
      id: "group-1",
      name: "Renamed Group",
      description: "New desc",
      exerciseDeadlineDay: 1,
      exerciseDeadlineTime: "14:30",
      isDeleted: false,
      inviteCode: "ABCD1234",
      createdBy: "user-1",
      createdAt: new Date("2026-03-30"),
    };

    it("updates group name and description", async () => {
      groupsService.update.mockResolvedValue(updatedGroup);

      const result = await controller.update("group-1", {
        name: "Renamed Group",
        description: "New desc",
        exerciseDeadlineDay: 1,
        exerciseDeadlineTime: "14:30",
      });

      expect(groupsService.update).toHaveBeenCalledWith("group-1", {
        name: "Renamed Group",
        description: "New desc",
      });
      expect(result).toEqual({ ok: true, data: updatedGroup });
    });

    it("updates exercise schedule fields", async () => {
      groupsService.update.mockResolvedValue(updatedGroup);

      const dto = {
        name: "Renamed Group",
        description: null,
        exerciseDeadlineDay: 1,
        exerciseDeadlineTime: "14:30",
      };
      const result = await controller.update("group-1", dto);

      expect(groupsService.update).toHaveBeenCalledWith("group-1", dto);
      expect(result.data.exerciseDeadlineDay).toBe(1);
      expect(result.data.exerciseDeadlineTime).toBe("14:30");
    });

    it("clears schedule when day is null", async () => {
      const clearedGroup = {
        ...updatedGroup,
        exerciseDeadlineDay: null,
        exerciseDeadlineTime: null,
      };
      groupsService.update.mockResolvedValue(clearedGroup);

      const dto = {
        name: "Renamed Group",
        description: null,
        exerciseDeadlineDay: null,
        exerciseDeadlineTime: null,
      };
      const result = await controller.update("group-1", dto);

      expect(result.data.exerciseDeadlineDay).toBeNull();
      expect(result.data.exerciseDeadlineTime).toBeNull();
    });

    it("propagates service error on update failure", async () => {
      groupsService.update.mockRejectedValue(new Error("Update failed"));

      await expect(
        controller.update("group-1", {
          name: "Test",
          description: null,
          exerciseDeadlineDay: null,
          exerciseDeadlineTime: null,
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("delete (DELETE :id)", () => {
    it("deletes group and returns ok", async () => {
      groupsService.deleteGroup.mockResolvedValue(undefined);

      const result = await controller.delete("group-1");

      expect(groupsService.deleteGroup).toHaveBeenCalledWith("group-1");
      expect(result).toEqual({ ok: true });
    });

    it("propagates service error on delete failure", async () => {
      groupsService.deleteGroup.mockRejectedValue(new Error("Delete failed"));

      await expect(controller.delete("group-1")).rejects.toThrow(
        "Delete failed",
      );
    });
  });
});
