import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";
import type { ProfileUpdateInput } from "@squademy/shared";

export class UpdateUserDto implements ProfileUpdateInput {
  @IsOptional()
  @IsString()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(VALIDATION.DISPLAY_NAME_MAX)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  fullName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  school?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(VALIDATION.AGE_MIN)
  @Max(VALIDATION.AGE_MAX)
  age?: number;
}
