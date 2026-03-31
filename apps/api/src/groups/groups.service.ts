import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, GROUP_ROLES, VALIDATION } from "@squademy/shared";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";

const MAX_INVITE_CODE_RETRIES = 3;

const generateInviteCode = customAlphabet(
  VALIDATION.INVITE_CODE_CHARSET,
  VALIDATION.INVITE_CODE_LENGTH,
);

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        isDeleted: false,
        group: {
          isDeleted: false,
        },
      },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: { where: { isDeleted: false } },
              },
            },
          },
        },
      },
      orderBy: {
        group: {
          createdAt: "desc",
        },
      },
    });

    return memberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      description: membership.group.description,
      role: membership.role,
      memberCount: membership.group._count.members,
      createdAt: membership.group.createdAt.toISOString(),
    }));
  }

  async create(userId: string, dto: CreateGroupDto) {
    for (let attempt = 0; attempt < MAX_INVITE_CODE_RETRIES; attempt++) {
      try {
        return await this.prisma.group.create({
          data: {
            name: dto.name,
            description: dto.description,
            inviteCode: generateInviteCode(),
            createdBy: userId,
            members: {
              create: {
                userId,
                role: GROUP_ROLES.ADMIN,
              },
            },
          },
          include: {
            members: { include: { user: { select: { id: true, displayName: true, email: true } } } },
          },
        });
      } catch (error) {
        if (!isUniqueConstraintError(error) || attempt === MAX_INVITE_CODE_RETRIES - 1) {
          throw error;
        }
      }
    }

    throw new BadRequestException("Could not generate unique invite code.");
  }

  async findById(id: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        members: {
          where: { isDeleted: false },
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
        },
      },
    });

    if (!group) {
      throw new NotFoundException({
        code: ErrorCode.GROUP_NOT_FOUND,
      });
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findFirst({
      where: { id, isDeleted: false },
    });

    if (!group) {
      throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
    }

    return this.prisma.group.update({
      where: { id },
      data: dto,
    });
  }

  async join(userId: string, inviteCode: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        inviteCode,
        isDeleted: false,
      },
    });

    if (!group) {
      throw new BadRequestException({
        code: ErrorCode.GROUP_INVALID_INVITE_CODE,
      });
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existingMember) {
      if (!existingMember.isDeleted) {
        throw new BadRequestException({
          code: ErrorCode.GROUP_ALREADY_MEMBER,
        });
      }

      await this.prisma.groupMember.update({
        where: { groupId_userId: { groupId: group.id, userId } },
        data: { isDeleted: false },
      });

      return group;
    }

    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: GROUP_ROLES.MEMBER,
      },
    });

    return group;
  }

  async deleteGroup(id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const updatedGroups = await tx.group.updateMany({
          where: {
            id,
            isDeleted: false,
          },
          data: {
            isDeleted: true,
          },
        });

        if (updatedGroups.count === 0) {
          throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
        }

        await tx.lesson.updateMany({
          where: { groupId: id },
          data: { isDeleted: true },
        });

        await tx.exercise.updateMany({
          where: { groupId: id },
          data: { isDeleted: true },
        });

        await tx.groupInvitation.deleteMany({
          where: { groupId: id },
        });

        await tx.groupMember.updateMany({
          where: { groupId: id, isDeleted: false },
          data: { isDeleted: true },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException({ code: ErrorCode.GROUP_DELETE_FAILED });
    }
  }

  async regenerateInviteCode(groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, isDeleted: false },
    });

    if (!group) {
      throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
    }

    for (let attempt = 0; attempt < MAX_INVITE_CODE_RETRIES; attempt++) {
      try {
        return await this.prisma.group.update({
          where: { id: groupId },
          data: { inviteCode: generateInviteCode() },
        });
      } catch (error) {
        if (!isUniqueConstraintError(error) || attempt === MAX_INVITE_CODE_RETRIES - 1) {
          throw error;
        }
      }
    }

    throw new BadRequestException("Could not generate unique invite code.");
  }
}
