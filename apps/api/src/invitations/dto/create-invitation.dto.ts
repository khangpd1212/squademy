import { IsString, IsUUID } from "class-validator";

export class CreateInvitationDto {
  @IsString()
  @IsUUID()
  groupId: string;

  @IsString()
  @IsUUID()
  inviteeId: string;
}
