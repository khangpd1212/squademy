import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GROUP_ROLES, VALIDATION } from "@squademy/shared";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";

const generateInviteCode = customAlphabet(
  VALIDATION.INVITE_CODE_CHARSET,
  VALIDATION.INVITE_CODE_LENGTH,
);

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGroupDto) {
    const inviteCode = generateInviteCode();

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        inviteCode,
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

    return group;
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
      throw new NotFoundException("Group not found");
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
      throw new BadRequestException("Invalid invite code");
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existingMember) {
      throw new BadRequestException("Already a member of this group");
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
    const inviteCode = generateInviteCode();

    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: { inviteCode },
    });

    return group;
  }
}
