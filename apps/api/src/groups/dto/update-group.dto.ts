import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";
import type { GroupSettingsInput } from "@squademy/shared";

export class UpdateGroupDto implements GroupSettingsInput {
  @IsOptional()
  @IsString()
  @MinLength(VALIDATION.GROUP_NAME_MIN)
  @MaxLength(VALIDATION.GROUP_NAME_MAX)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.GROUP_DESCRIPTION_MAX)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(VALIDATION.DEADLINE_DAY_MIN)
  @Max(VALIDATION.DEADLINE_DAY_MAX)
  exerciseDeadlineDay?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "Time must be in HH:MM format." })
  exerciseDeadlineTime?: string;
}
