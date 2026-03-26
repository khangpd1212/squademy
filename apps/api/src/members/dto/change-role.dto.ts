import { GROUP_ROLES } from "@squademy/shared";
import type { MemberRoleInput } from "@squademy/shared";
import { IsIn, IsString } from "class-validator";

export class ChangeRoleDto implements MemberRoleInput {
  @IsString()
  @IsIn([GROUP_ROLES.ADMIN, GROUP_ROLES.EDITOR, GROUP_ROLES.MEMBER])
  role: MemberRoleInput["role"];
}
