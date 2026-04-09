import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { GroupAdminGuard } from "../common/guards/group-admin.guard";
import { GroupMemberGuard } from "../common/guards/group-member.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";

@Controller("groups")
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    const group = await this.groupsService.create(user.userId, dto);
    return { ok: true, data: group };
  }

  @Get("me")
  async findMine(@CurrentUser() user: JwtPayload) {
    const groups = await this.groupsService.findMyGroups(user.userId);
    return { ok: true, data: groups };
  }

  @Post("join")
  async join(@CurrentUser() user: JwtPayload, @Body() dto: JoinGroupDto) {
    const group = await this.groupsService.join(user.userId, dto.inviteCode);
    return { ok: true, data: group };
  }

  @Get(":id")
  @UseGuards(GroupMemberGuard)
  async findOne(@Param("id") id: string) {
    const group = await this.groupsService.findById(id);
    return { ok: true, data: group };
  }

  @Get(":id/learning-path")
  @UseGuards(GroupMemberGuard)
  async getLearningPath(@Param("id") id: string) {
    const items = await this.groupsService.getLearningPath(id);
    return { ok: true, data: items };
  }

  @Post(":id/learning-path")
  @UseGuards(GroupMemberGuard)
  async addLearningPathItem(
    @Param("id") id: string,
    @Body() dto: { lessonId?: string; deckId?: string },
  ) {
    const item = await this.groupsService.addLearningPathItem(id, dto);
    return { ok: true, data: item };
  }

  @Patch(":id")
  @UseGuards(GroupAdminGuard)
  async update(@Param("id") id: string, @Body() dto: UpdateGroupDto) {
    const group = await this.groupsService.update(id, dto);
    return { ok: true, data: group };
  }

  @Delete(":id")
  @UseGuards(GroupAdminGuard)
  async delete(@Param("id") id: string) {
    await this.groupsService.deleteGroup(id);
    return { ok: true };
  }

  @Post(":id/invite-link")
  @UseGuards(GroupAdminGuard)
  async regenerateInviteCode(@Param("id") id: string) {
    const group = await this.groupsService.regenerateInviteCode(id);
    return { ok: true, data: { inviteCode: group.inviteCode } };
  }
}
