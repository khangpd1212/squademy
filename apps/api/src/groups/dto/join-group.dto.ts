import { IsString, MaxLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";

export class JoinGroupDto {
  @IsString()
  @MaxLength(VALIDATION.INVITE_CODE_LENGTH)
  inviteCode: string;
}
