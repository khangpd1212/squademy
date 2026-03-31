import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";
import { GroupSettingsInput, VALIDATION } from "@squademy/shared";

export class UpdateGroupDto implements GroupSettingsInput {
  @IsString()
  @MinLength(VALIDATION.GROUP_NAME_MIN)
  @MaxLength(VALIDATION.GROUP_NAME_MAX)
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @MaxLength(VALIDATION.GROUP_DESCRIPTION_MAX)
  description: string | null;

  @IsOptional()
  @IsInt()
  @Min(VALIDATION.DEADLINE_DAY_MIN)
  @Max(VALIDATION.DEADLINE_DAY_MAX)
  exerciseDeadlineDay: number | null;

  @IsOptional()
  @ValidateIf((o) => o.exerciseDeadlineTime !== null)
  @IsString()
  @Matches(VALIDATION.DEADLINE_TIME_REGEX, { message: "Time must be in HH:MM format (00:00–23:59)." })
  exerciseDeadlineTime: string | null;
}
