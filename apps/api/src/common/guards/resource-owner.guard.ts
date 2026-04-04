import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    const lessonId = req.params.id;

    if (!lessonId) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isDeleted: false },
      select: { authorId: true },
    });

    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    if (lesson.authorId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.LESSON_NOT_OWNER });
    }

    return true;
  }
}
