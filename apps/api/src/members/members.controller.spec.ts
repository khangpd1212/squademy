import "reflect-metadata";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import type { JwtPayload } from "../common/decorators/current-user.decorator";
import { MembersController } from "./members.controller";
import type { MembersService } from "./members.service";

describe("MembersController", () => {
  it("has JwtAuthGuard applied at controller level", () => {
    const guards = Reflect.getMetadata("__guards__", MembersController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  let controller: MembersController;
  let membersService: jest.Mocked<MembersService>;

  beforeEach(() => {
    membersService = {
      listByGroup: jest.fn(),
      remove: jest.fn(),
      changeRole: jest.fn(),
    } as unknown as jest.Mocked<MembersService>;

    controller = new MembersController(membersService);
  });

  it("lists members for a group", async () => {
    const rows = [
      {
        userId: "u1",
        role: "admin",
        joinedAt: new Date("2026-01-01"),
        user: {
          id: "u1",
          displayName: "A",
          email: "a@e.com",
          avatarUrl: null as string | null,
        },
      },
    ];
    membersService.listByGroup.mockResolvedValue(rows as never);

    const result = await controller.list("group-1");

    expect(membersService.listByGroup).toHaveBeenCalledWith("group-1");
    expect(result).toEqual({ ok: true, data: rows });
  });

  it("changes member role via service", async () => {
    const updated = {
      userId: "u2",
      role: "editor",
      user: { id: "u2", displayName: "B", email: "b@e.com", avatarUrl: null },
    };
    membersService.changeRole.mockResolvedValue(updated as never);

    const result = await controller.changeRole("g1", "u2", { role: "editor" });

    expect(membersService.changeRole).toHaveBeenCalledWith("g1", "u2", "editor");
    expect(result).toEqual({ ok: true, data: updated });
  });

  it("removes a member via service", async () => {
    membersService.remove.mockResolvedValue({ removed: true });

    const requester: JwtPayload = { userId: "admin-1", email: "a@e.com" };
    const result = await controller.remove("g1", "u2", requester);

    expect(membersService.remove).toHaveBeenCalledWith("g1", "u2", "admin-1");
    expect(result).toEqual({ ok: true, data: { removed: true } });
  });

  it("propagates service errors", async () => {
    membersService.listByGroup.mockRejectedValue(new Error("DB error"));

    await expect(controller.list("g1")).rejects.toThrow("DB error");
  });
});
