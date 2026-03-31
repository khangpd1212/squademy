import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { InvitationsService } from "./invitations.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { RespondInvitationDto } from "./dto/respond-invitation.dto";

@Controller("invitations")
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvitationDto,
  ) {
    const invitation = await this.invitationsService.create(
      dto.groupId,
      user.userId,
      dto.inviteeId,
    );
    return { ok: true, data: invitation };
  }

  @Patch(":id")
  async respond(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RespondInvitationDto,
  ) {
    const invitation = await this.invitationsService.respond(
      id,
      user.userId,
      dto.status,
    );
    return { ok: true, data: invitation };
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const invitations = await this.invitationsService.listForUser(user.userId);
    return { ok: true, data: invitations };
  }
}
