import "reflect-metadata";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GroupsController } from "./groups.controller";
import type { GroupsService } from "./groups.service";

describe("GroupsController", () => {
  it("has JwtAuthGuard applied at controller level", () => {
    const guards = Reflect.getMetadata("__guards__", GroupsController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  let controller: GroupsController;
  let groupsService: jest.Mocked<GroupsService>;

  beforeEach(() => {
    groupsService = {
      findMyGroups: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
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

    const result = await controller.findMine({ userId: "user-1", email: "u@e.com" });

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

    const result = await controller.findMine({ userId: "user-2", email: "u2@e.com" });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("propagates service errors (e.g. DB failure)", async () => {
    groupsService.findMyGroups.mockRejectedValue(new Error("DB connection lost"));

    await expect(
      controller.findMine({ userId: "user-1", email: "u@e.com" }),
    ).rejects.toThrow("DB connection lost");
  });
});
