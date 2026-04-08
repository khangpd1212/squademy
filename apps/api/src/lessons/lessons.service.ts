import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, GROUP_ROLES, LESSON_STATUS } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { CreateReviewCommentDto } from "./dto/create-review-comment.dto";

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByAuthor(userId: string) {
    return this.prisma.lesson.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
        group: { isDeleted: false },
      },
      select: {
        id: true,
        title: true,
        status: true,
        groupId: true,
        updatedAt: true,
        group: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOneById(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
    });
    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    // Allow any group member to view published lessons
    if (lesson.status === LESSON_STATUS.PUBLISHED) {
      const membership = await this.prisma.groupMember.findFirst({
        where: { userId, groupId: lesson.groupId, isDeleted: false },
      });
      if (membership) {
        return {
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          contentMarkdown: lesson.contentMarkdown,
          status: lesson.status,
          groupId: lesson.groupId,
          authorId: lesson.authorId,
          updatedAt: lesson.updatedAt,
        };
      }
    }

    // Original logic: only owner can view non-published lessons
    if (lesson.authorId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_OWNER });
    }
    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      contentMarkdown: lesson.contentMarkdown,
      status: lesson.status,
      groupId: lesson.groupId,
      authorId: lesson.authorId,
      updatedAt: lesson.updatedAt,
    };
  }

  async update(lessonId: string, userId: string, data: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
    });
    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }
    if (lesson.authorId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_OWNER });
    }
    if (
      lesson.status !== LESSON_STATUS.DRAFT &&
      lesson.status !== LESSON_STATUS.REJECTED
    ) {
      throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_EDITABLE });
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && {
          content: data.content as object,
        }),
        ...(data.contentMarkdown !== undefined && {
          contentMarkdown: data.contentMarkdown,
        }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        contentMarkdown: true,
        status: true,
        groupId: true,
        authorId: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async create(authorId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, isDeleted: false },
    });
    if (!group) {
      throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
    }

    const membership = await this.prisma.groupMember.findFirst({
      where: { userId: authorId, groupId, isDeleted: false },
    });
    if (!membership) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN_NOT_MEMBER });
    }

    try {
      return await this.prisma.lesson.create({
        data: {
          authorId,
          groupId,
          title: "Untitled Lesson",
          status: LESSON_STATUS.DRAFT,
        },
        select: { id: true, title: true, status: true, groupId: true },
      });
    } catch {
      throw new BadRequestException({
        code: ErrorCode.LESSON_CREATE_FAILED,
      });
    }
  }

  async submit(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
    });
    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }
    if (lesson.status !== LESSON_STATUS.DRAFT && lesson.status !== LESSON_STATUS.REJECTED) {
      throw new BadRequestException({ code: ErrorCode.LESSON_INVALID_STATUS_FOR_SUBMIT });
    }

    try {
      return await this.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LESSON_STATUS.REVIEW },
        select: {
          id: true,
          title: true,
          content: true,
          contentMarkdown: true,
          status: true,
          groupId: true,
          authorId: true,
          updatedAt: true,
        },
      });
    } catch {
      throw new BadRequestException({ code: ErrorCode.LESSON_SUBMIT_FAILED });
    }
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, isDeleted: false },
    });
    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }
    if (lesson.status === LESSON_STATUS.REVIEW || lesson.status === LESSON_STATUS.PUBLISHED) {
      throw new BadRequestException({ code: ErrorCode.LESSON_DELETE_NOT_ALLOWED });
    }
    try {
      await this.prisma.lesson.update({
        where: { id },
        data: { isDeleted: true },
      });
    } catch {
      throw new BadRequestException({ code: ErrorCode.LESSON_DELETE_FAILED });
    }
  }

  async findReviewQueue(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        isDeleted: false,
        role: { in: [GROUP_ROLES.EDITOR, GROUP_ROLES.ADMIN] },
      },
      select: { groupId: true },
    });
    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return [];

    return this.prisma.lesson.findMany({
      where: {
        groupId: { in: groupIds },
        status: LESSON_STATUS.REVIEW,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { displayName: true, fullName: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findReviewDetail(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
      select: {
        id: true,
        title: true,
        content: true,
        contentMarkdown: true,
        status: true,
        groupId: true,
        authorId: true,
        updatedAt: true,
        author: { select: { displayName: true, fullName: true } },
        group: { select: { name: true } },
      },
    });
    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }
    return lesson;
  }

  async approveLesson(id: string) {
    try {
      const updated = await this.prisma.lesson.update({
        where: { id, isDeleted: false, status: LESSON_STATUS.REVIEW },
        data: { status: LESSON_STATUS.PUBLISHED },
        select: { id: true, title: true, status: true, groupId: true, authorId: true },
      });
      return updated;
    } catch (err) {
      if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2025") {
        const lesson = await this.prisma.lesson.findFirst({
          where: { id, isDeleted: false },
          select: { status: true },
        });
        if (!lesson) {
          throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
        }
        throw new BadRequestException({ code: ErrorCode.LESSON_NOT_IN_REVIEW });
      }
      throw new BadRequestException({ code: ErrorCode.LESSON_APPROVE_FAILED });
    }
  }

  async rejectLesson(id: string, feedback: string) {
    try {
      const updated = await this.prisma.lesson.update({
        where: { id, isDeleted: false, status: LESSON_STATUS.REVIEW },
        data: { status: LESSON_STATUS.REJECTED, editorFeedback: feedback },
        select: { id: true, title: true, status: true, groupId: true, authorId: true, editorFeedback: true },
      });
      return updated;
    } catch (err) {
      if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2025") {
        const lesson = await this.prisma.lesson.findFirst({
          where: { id, isDeleted: false },
          select: { status: true },
        });
        if (!lesson) {
          throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
        }
        throw new BadRequestException({ code: ErrorCode.LESSON_NOT_IN_REVIEW });
      }
      throw new BadRequestException({ code: ErrorCode.LESSON_REJECT_FAILED });
    }
  }

  async getCommentsByLesson(lessonId: string) {
    return this.prisma.reviewComment.findMany({
      where: { lessonId },
      include: {
        author: { select: { displayName: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createComment(lessonId: string, userId: string, dto: CreateReviewCommentDto) {
    if (dto.parentId) {
      const parent = await this.prisma.reviewComment.findFirst({
        where: { id: dto.parentId, lessonId },
      });
      if (!parent) {
        throw new BadRequestException({ code: ErrorCode.REVIEW_COMMENT_NOT_FOUND });
      }
    }

    try {
      return await this.prisma.reviewComment.create({
        data: {
          lessonId,
          userId,
          lineRef: dto.lineRef,
          body: dto.body,
          parentId: dto.parentId,
        },
        include: {
          author: { select: { displayName: true, fullName: true, avatarUrl: true } },
        },
      });
    } catch {
      throw new BadRequestException({ code: ErrorCode.REVIEW_COMMENT_CREATE_FAILED });
    }
  }

  async deleteComment(commentId: string, userId: string, lessonId: string) {
    const comment = await this.prisma.reviewComment.findFirst({
      where: { id: commentId, lessonId },
    });
    if (!comment) {
      throw new NotFoundException({ code: ErrorCode.REVIEW_COMMENT_NOT_FOUND });
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN_NOT_COMMENT_OWNER });
    }

    try {
      await this.prisma.reviewComment.delete({ where: { id: commentId } });
    } catch {
      throw new BadRequestException({ code: ErrorCode.REVIEW_COMMENT_DELETE_FAILED });
    }
  }

  async findPublishedByGroup(groupId: string) {
    return this.prisma.lesson.findMany({
      where: {
        groupId,
        status: LESSON_STATUS.PUBLISHED,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        contentMarkdown: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { displayName: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
