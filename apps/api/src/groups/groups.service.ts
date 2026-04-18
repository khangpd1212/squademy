import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, GROUP_ROLES, LESSON_STATUS, VALIDATION, FLASHCARD_DECK_STATUS } from "@squademy/shared";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { Prisma } from "@squademy/database";

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

  async findMyGroups(userId: string, roles?: string[]) {
    const where: Prisma.GroupMemberWhereInput = {
      userId,
      isDeleted: false,
      group: {
        isDeleted: false,
      },
    };

    if (roles && roles.length > 0) {
      where.role = { in: roles };
    }

    const memberships = await this.prisma.groupMember.findMany({
      where,
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

  async getLearningPath(groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, isDeleted: false },
    });
    if (!group) {
      throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
    }

    return this.prisma.learningPathItem.findMany({
      where: { groupId },
      orderBy: { sortOrder: "asc" },
      include: {
        lesson: {
          where: { isDeleted: false, status: LESSON_STATUS.PUBLISHED },
          select: { id: true, title: true, status: true },
        },
        deck: { select: { id: true, title: true } },
      },
    });
  }

  async addLearningPathItem(groupId: string, dto: { lessonId?: string; deckId?: string }) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, isDeleted: false },
    });
    if (!group) {
      throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
    }

    if (!dto.lessonId && !dto.deckId) {
      throw new BadRequestException("Either lessonId or deckId is required.");
    }

    if (dto.lessonId) {
      const existing = await this.prisma.learningPathItem.findFirst({
        where: { groupId, lessonId: dto.lessonId },
      });
      if (existing) {
        throw new BadRequestException({ code: ErrorCode.LEARNING_PATH_ITEM_EXISTS });
      }
    }

    if (dto.deckId) {
      const existing = await this.prisma.learningPathItem.findFirst({
        where: { groupId, deckId: dto.deckId },
      });
      if (existing) {
        throw new BadRequestException({ code: ErrorCode.LEARNING_PATH_ITEM_EXISTS });
      }
    }

    const lastItem = await this.prisma.learningPathItem.findFirst({
      where: { groupId },
      orderBy: { sortOrder: "desc" },
    });
    const nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

    return this.prisma.learningPathItem.create({
      data: {
        groupId,
        lessonId: dto.lessonId ?? null,
        deckId: dto.deckId ?? null,
        sortOrder: nextSortOrder,
      },
      include: {
        lesson: { select: { id: true, title: true, status: true } },
        deck: { select: { id: true, title: true } },
      },
    });
  }

  async getLearningPathItemsForEdit(groupId: string) {
    const inPathItems = await this.prisma.learningPathItem.findMany({
      where: {
        groupId,
        OR: [
          { lessonId: null },
          { lesson: { isDeleted: false } },
        ],
      },
      orderBy: { sortOrder: "asc" },
      include: {
        lesson: {
          select: { id: true, title: true, status: true, author: { select: { displayName: true } } },
        },
        deck: { select: { id: true, title: true } },
      },
    });

    const inPathLessonIds = inPathItems.filter(i => i.lessonId).map(i => i.lessonId!);
    const inPathDeckIds = inPathItems.filter(i => i.deckId).map(i => i.deckId!);

    const availableLessons = await this.prisma.lesson.findMany({
      where: {
        groupId,
        isDeleted: false,
        status: LESSON_STATUS.PUBLISHED,
        id: { notIn: inPathLessonIds },
      },
      select: {
        id: true,
        title: true,
        status: true,
        author: { select: { displayName: true } },
      },
      orderBy: { title: "asc" },
    });

    const availableDecks = await this.prisma.flashcardDeck.findMany({
      where: {
        status: FLASHCARD_DECK_STATUS.PUBLISHED,
        id: { notIn: inPathDeckIds },
        learningPathItems: { none: { groupId } },
      },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    return {
      inPath: inPathItems,
      availableLessons,
      availableDecks,
    };
  }

  async reorderLearningPath(groupId: string, itemIds: string[]) {
    const items = await this.prisma.learningPathItem.findMany({
      where: { groupId },
      select: { id: true },
    });

    const existingIds = new Set(items.map(i => i.id));
    for (const id of itemIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException({ code: ErrorCode.LEARNING_PATH_ITEM_NOT_FOUND });
      }
    }

    await this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.learningPathItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.prisma.learningPathItem.findMany({
      where: { groupId },
      orderBy: { sortOrder: "asc" },
      include: {
        lesson: { select: { id: true, title: true, status: true, author: { select: { displayName: true } } } },
        deck: { select: { id: true, title: true } },
      },
    });
  }

  async removeLearningPathItem(groupId: string, itemId: string) {
    const item = await this.prisma.learningPathItem.findFirst({
      where: { id: itemId, groupId },
    });

    if (!item) {
      throw new NotFoundException({ code: ErrorCode.LEARNING_PATH_ITEM_NOT_FOUND });
    }

    await this.prisma.learningPathItem.delete({ where: { id: itemId } });

    const remainingItems = await this.prisma.learningPathItem.findMany({
      where: { groupId },
      orderBy: { sortOrder: "asc" },
    });

    await this.prisma.$transaction(
      remainingItems.map((item, index) =>
        this.prisma.learningPathItem.update({
          where: { id: item.id },
          data: { sortOrder: index },
        }),
      ),
    );

    return remainingItems;
  }
}
