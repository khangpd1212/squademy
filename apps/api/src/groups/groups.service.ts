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
      where: { userId },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
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
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
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
    return this.prisma.group.update({
      where: { id },
      data: dto,
    });
  }

  async join(userId: string, inviteCode: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode },
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
      throw new BadRequestException({
        code: ErrorCode.GROUP_ALREADY_MEMBER,
      });
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

  async regenerateInviteCode(groupId: string) {
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
