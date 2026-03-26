import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";
import type { CreateGroupInput } from "@squademy/shared";

export class CreateGroupDto implements CreateGroupInput {
  @IsString()
  @MinLength(VALIDATION.GROUP_NAME_MIN)
  @MaxLength(VALIDATION.GROUP_NAME_MAX)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.GROUP_DESCRIPTION_MAX)
  description?: string;
}
