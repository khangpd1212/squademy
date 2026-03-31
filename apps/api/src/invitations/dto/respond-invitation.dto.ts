import { INVITATION_STATUS } from "@squademy/shared";
import { IsIn, IsString } from "class-validator";

export class RespondInvitationDto {
  @IsString()
  @IsIn([INVITATION_STATUS.ACCEPTED, INVITATION_STATUS.DECLINED])
  status: string;
}
