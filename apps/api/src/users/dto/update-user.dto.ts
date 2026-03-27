import { IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from "class-validator";
import { ProfileFormValues, VALIDATION } from "@squademy/shared";

export class UpdateUserDto implements ProfileFormValues {
  @IsOptional()
  @IsString()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(VALIDATION.DISPLAY_NAME_MAX)
  displayName: string;

  @IsEmail()
  email: string;

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

  @IsInt()
  @Min(VALIDATION.AGE_MIN)
  @Max(VALIDATION.AGE_MAX)
  age: number | null;
}
