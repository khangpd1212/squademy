import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GroupAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.userId;
    const groupId: string | undefined =
      request.params.groupId || request.params.id;

    if (!userId || !groupId) {
      throw new ForbiddenException("Missing user or group context");
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.role !== "admin") {
      throw new ForbiddenException("Admin access required");
    }

    request.membership = membership;
    return true;
  }
}
