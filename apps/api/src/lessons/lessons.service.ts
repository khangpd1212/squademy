import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode, LESSON_STATUS } from "@squademy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLessonDto } from "./dto/update-lesson.dto";

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
}
