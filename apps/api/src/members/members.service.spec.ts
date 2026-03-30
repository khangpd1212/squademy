import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { MembersService } from "./members.service";
import type { PrismaService } from "../prisma/prisma.service";

describe("MembersService", () => {
  let service: MembersService;
  let prisma: {
    groupMember: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      groupMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new MembersService(prisma as unknown as PrismaService);
  });

  describe("listByGroup", () => {
    it("returns members ordered by joinedAt ascending", async () => {
      const mockMembers = [
        { userId: "u1", role: "admin", user: { id: "u1", displayName: "Alice" } },
        { userId: "u2", role: "member", user: { id: "u2", displayName: "Bob" } },
      ];
      prisma.groupMember.findMany.mockResolvedValue(mockMembers);

      const result = await service.listByGroup("g1");

      expect(result).toEqual(mockMembers);
      expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: "g1" },
        include: {
          user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      });
    });
  });

  describe("changeRole", () => {
    it("updates role when target exists and is not sole admin", async () => {
      prisma.groupMember.findUnique.mockResolvedValue({
        userId: "u2",
        role: "member",
        groupId: "g1",
      });
      const updated = { userId: "u2", role: "editor", user: { displayName: "Bob" } };
      prisma.groupMember.update.mockResolvedValue(updated);

      const result = await service.changeRole("g1", "u2", "editor");

      expect(result).toEqual(updated);
      expect(prisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: "editor" } }),
      );
    });

    it("allows demoting admin when multiple admins exist", async () => {
      prisma.groupMember.findUnique.mockResolvedValue({
        userId: "u1",
        role: "admin",
        groupId: "g1",
      });
      prisma.groupMember.count.mockResolvedValue(2);
      prisma.groupMember.update.mockResolvedValue({ userId: "u1", role: "member" });

      await expect(service.changeRole("g1", "u1", "member")).resolves.toBeDefined();
      expect(prisma.groupMember.count).toHaveBeenCalledWith({
        where: { groupId: "g1", role: "admin" },
      });
    });

    it("throws MEMBER_SOLE_ADMIN_DEMOTE when demoting the only admin", async () => {
      prisma.groupMember.findUnique.mockResolvedValue({
        userId: "u1",
        role: "admin",
        groupId: "g1",
      });
      prisma.groupMember.count.mockResolvedValue(1);

      const err = await service
        .changeRole("g1", "u1", "member")
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual({
        code: ErrorCode.MEMBER_SOLE_ADMIN_DEMOTE,
      });
    });

    it("throws MEMBER_NOT_FOUND when target does not exist", async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.changeRole("g1", "ghost", "editor")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("skips admin count check when admin keeps admin role", async () => {
      prisma.groupMember.findUnique.mockResolvedValue({
        userId: "u1",
        role: "admin",
        groupId: "g1",
      });
      prisma.groupMember.update.mockResolvedValue({ userId: "u1", role: "admin" });

      await service.changeRole("g1", "u1", "admin");

      expect(prisma.groupMember.count).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("allows admin to remove another member", async () => {
      prisma.groupMember.findUnique
        .mockResolvedValueOnce({ userId: "u2", role: "member", groupId: "g1" })
        .mockResolvedValueOnce({ userId: "u1", role: "admin", groupId: "g1" });
      prisma.groupMember.delete.mockResolvedValue({});

      const result = await service.remove("g1", "u2", "u1");

      expect(result).toEqual({ removed: true });
      expect(prisma.groupMember.delete).toHaveBeenCalled();
    });

    it("allows self-removal without admin check", async () => {
      prisma.groupMember.findUnique.mockResolvedValueOnce({
        userId: "u2",
        role: "member",
        groupId: "g1",
      });
      prisma.groupMember.delete.mockResolvedValue({});

      const result = await service.remove("g1", "u2", "u2");

      expect(result).toEqual({ removed: true });
      expect(prisma.groupMember.findUnique).toHaveBeenCalledTimes(1);
    });

    it("throws MEMBER_ADMIN_REQUIRED when non-admin removes another", async () => {
      prisma.groupMember.findUnique
        .mockResolvedValueOnce({ userId: "u2", role: "member", groupId: "g1" })
        .mockResolvedValueOnce({ userId: "u3", role: "member", groupId: "g1" });

      await expect(service.remove("g1", "u2", "u3")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws MEMBER_SOLE_ADMIN_REMOVE when removing the only admin", async () => {
      prisma.groupMember.findUnique
        .mockResolvedValueOnce({ userId: "u1", role: "admin", groupId: "g1" })
        .mockResolvedValueOnce({ userId: "u99", role: "admin", groupId: "g1" });
      prisma.groupMember.count.mockResolvedValue(1);

      await expect(service.remove("g1", "u1", "u99")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws MEMBER_NOT_FOUND when target does not exist", async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.remove("g1", "ghost", "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws MEMBER_ADMIN_REQUIRED when requester is not a group member", async () => {
      prisma.groupMember.findUnique
        .mockResolvedValueOnce({ userId: "u2", role: "member", groupId: "g1" })
        .mockResolvedValueOnce(null);

      await expect(service.remove("g1", "u2", "outsider")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
