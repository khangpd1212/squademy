import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, GROUP_ROLES } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listByGroup(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  }

  async remove(groupId: string, memberId: string, requesterId: string) {
    const target = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
    });

    if (!target) {
      throw new NotFoundException({
        code: ErrorCode.MEMBER_NOT_FOUND,
      });
    }

    const isSelfRemoval = memberId === requesterId;

    if (!isSelfRemoval) {
      const requester = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: requesterId } },
      });

      if (!requester || requester.role !== GROUP_ROLES.ADMIN) {
        throw new ForbiddenException({
          code: ErrorCode.MEMBER_ADMIN_REQUIRED,
        });
      }
    }

    if (target.role === GROUP_ROLES.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: { groupId, role: GROUP_ROLES.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException({
          code: ErrorCode.MEMBER_SOLE_ADMIN_REMOVE,
        });
      }
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: memberId } },
    });

    return { removed: true };
  }

  async changeRole(groupId: string, memberId: string, role: string) {
    const target = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
    });

    if (!target) {
      throw new NotFoundException({
        code: ErrorCode.MEMBER_NOT_FOUND,
      });
    }

    if (target.role === GROUP_ROLES.ADMIN && role !== GROUP_ROLES.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: { groupId, role: GROUP_ROLES.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException({
          code: ErrorCode.MEMBER_SOLE_ADMIN_DEMOTE,
        });
      }
    }

    return this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: memberId } },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
