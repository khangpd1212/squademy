import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LessonCommentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.userId;
    const lessonId: string | undefined = request.params.lessonId || request.params.id;

    if (!userId || !lessonId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_MISSING_CONTEXT,
      });
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
      select: { groupId: true },
    });

    if (!lesson) {
      throw new ForbiddenException({
        code: ErrorCode.LESSON_NOT_FOUND,
      });
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: lesson.groupId, userId } },
    });

    if (!membership || membership.isDeleted) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_NOT_MEMBER,
      });
    }

    request.membership = membership;
    return true;
  }
}