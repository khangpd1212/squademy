import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GROUP_ROLES, INVITATION_STATUS } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(groupId: string, invitedBy: string, inviteeId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: invitedBy } },
    });

    if (!membership || membership.role !== GROUP_ROLES.ADMIN) {
      throw new ForbiddenException("Only admins can send invitations");
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: inviteeId } },
    });

    if (existingMember) {
      throw new BadRequestException("User is already a member of this group");
    }

    const existingInvite = await this.prisma.groupInvitation.findFirst({
      where: { groupId, inviteeId, status: INVITATION_STATUS.PENDING },
    });

    if (existingInvite) {
      throw new BadRequestException("Invitation already pending for this user");
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
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException("You can only respond to your own invitations");
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new BadRequestException("Invitation has already been responded to");
    }

    const updated = await this.prisma.groupInvitation.update({
      where: { id },
      data: { status },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    if (status === INVITATION_STATUS.ACCEPTED) {
      await this.prisma.groupMember.create({
        data: {
          groupId: invitation.groupId,
          userId,
          role: GROUP_ROLES.MEMBER,
        },
      });
    }

    return updated;
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
