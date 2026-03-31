import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, GROUP_ROLES, INVITATION_STATUS } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(groupId: string, invitedBy: string, inviteeId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: invitedBy } },
    });

    if (
      !membership ||
      membership.isDeleted ||
      membership.role !== GROUP_ROLES.ADMIN
    ) {
      throw new ForbiddenException({
        code: ErrorCode.INVITATION_ADMIN_ONLY,
      });
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: inviteeId } },
    });

    if (existingMember && !existingMember.isDeleted) {
      throw new BadRequestException({
        code: ErrorCode.INVITATION_ALREADY_MEMBER,
      });
    }

    const existingInvite = await this.prisma.groupInvitation.findFirst({
      where: { groupId, inviteeId, status: INVITATION_STATUS.PENDING },
    });

    if (existingInvite) {
      throw new BadRequestException({
        code: ErrorCode.INVITATION_ALREADY_PENDING,
      });
    }

    return this.prisma.groupInvitation.create({
      data: {
        groupId,
        invitedBy,
        inviteeId,
      },
      include: {
        group: { select: { id: true, name: true } },
        inviter: { select: { id: true, displayName: true } },
        invitee: { select: { id: true, displayName: true } },
      },
    });
  }

  async respond(id: string, userId: string, status: string) {
    const invitation = await this.prisma.groupInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException({
        code: ErrorCode.INVITATION_NOT_FOUND,
      });
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.INVITATION_NOT_OWNER,
      });
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new BadRequestException({
        code: ErrorCode.INVITATION_ALREADY_RESPONDED,
      });
    }

    if (status === INVITATION_STATUS.ACCEPTED) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.groupInvitation.update({
          where: { id },
          data: { status },
          include: {
            group: { select: { id: true, name: true } },
          },
        });

        const existing = await tx.groupMember.findUnique({
          where: {
            groupId_userId: { groupId: invitation.groupId, userId },
          },
        });

        if (existing) {
          if (!existing.isDeleted) {
            throw new BadRequestException({
              code: ErrorCode.GROUP_ALREADY_MEMBER,
            });
          }
          await tx.groupMember.update({
            where: {
              groupId_userId: { groupId: invitation.groupId, userId },
            },
            data: { isDeleted: false, role: GROUP_ROLES.MEMBER },
          });
        } else {
          await tx.groupMember.create({
            data: {
              groupId: invitation.groupId,
              userId,
              role: GROUP_ROLES.MEMBER,
            },
          });
        }

        return updated;
      });
    }

    return this.prisma.groupInvitation.update({
      where: { id },
      data: { status },
      include: {
        group: { select: { id: true, name: true } },
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.groupInvitation.findMany({
      where: { inviteeId: userId, status: INVITATION_STATUS.PENDING },
      include: {
        group: { select: { id: true, name: true } },
        inviter: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
