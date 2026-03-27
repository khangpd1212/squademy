import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ErrorCode } from "@squademy/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.userId;
    const groupId: string | undefined =
      request.params.groupId || request.params.id;

    if (!userId || !groupId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_MISSING_CONTEXT,
      });
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_NOT_MEMBER,
      });
    }

    request.membership = membership;
    return true;
  }
}
