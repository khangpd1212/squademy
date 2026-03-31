import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { CreateGroupInput, VALIDATION } from "@squademy/shared";

export class CreateGroupDto implements CreateGroupInput {
  @IsString()
  @MinLength(VALIDATION.GROUP_NAME_MIN)
  @MaxLength(VALIDATION.GROUP_NAME_MAX)
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @MaxLength(VALIDATION.GROUP_DESCRIPTION_MAX)
  description: string | null;
}
