import { GROUP_ROLES, type MemberRole } from "@squademy/shared";
import { IsIn, IsString } from "class-validator";

export class ChangeRoleDto {
  @IsString()
  @IsIn([GROUP_ROLES.ADMIN, GROUP_ROLES.EDITOR, GROUP_ROLES.MEMBER])
  role: MemberRole;
}
