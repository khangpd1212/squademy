import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GROUP_ROLES } from "@squademy/shared";
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
      throw new NotFoundException("Member not found");
    }

    const isSelfRemoval = memberId === requesterId;

    if (!isSelfRemoval) {
      const requester = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: requesterId } },
      });

      if (!requester || requester.role !== GROUP_ROLES.ADMIN) {
        throw new ForbiddenException("Admin access required to remove others");
      }
    }

    if (target.role === GROUP_ROLES.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: { groupId, role: GROUP_ROLES.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          "Cannot remove the sole admin. Transfer admin role first.",
        );
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
      throw new NotFoundException("Member not found");
    }

    if (target.role === GROUP_ROLES.ADMIN && role !== GROUP_ROLES.ADMIN) {
      const adminCount = await this.prisma.groupMember.count({
        where: { groupId, role: GROUP_ROLES.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          "Cannot demote the sole admin. Promote another admin first.",
        );
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
