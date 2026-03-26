import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import { GroupAdminGuard } from "../common/guards/group-admin.guard";
import { GroupMemberGuard } from "../common/guards/group-member.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { MembersService } from "./members.service";
import { ChangeRoleDto } from "./dto/change-role.dto";

@Controller("groups/:groupId/members")
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @UseGuards(GroupMemberGuard)
  async list(@Param("groupId") groupId: string) {
    const members = await this.membersService.listByGroup(groupId);
    return { ok: true, data: members };
  }

  @Delete(":memberId")
  async remove(
    @Param("groupId") groupId: string,
    @Param("memberId") memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.membersService.remove(
      groupId,
      memberId,
      user.userId,
    );
    return { ok: true, data: result };
  }

  @Patch(":memberId/role")
  @UseGuards(GroupAdminGuard)
  async changeRole(
    @Param("groupId") groupId: string,
    @Param("memberId") memberId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    const member = await this.membersService.changeRole(
      groupId,
      memberId,
      dto.role,
    );
    return { ok: true, data: member };
  }
}
