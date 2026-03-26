import { IsIn, IsString } from "class-validator";

export class ChangeRoleDto {
  @IsString()
  @IsIn(["admin", "member"])
  role: string;
}
