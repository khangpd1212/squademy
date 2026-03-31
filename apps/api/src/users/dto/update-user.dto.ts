import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import { ProfileEditValues, VALIDATION } from "@squademy/shared";

export class UpdateUserDto implements ProfileEditValues {
  @IsString()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(VALIDATION.DISPLAY_NAME_MAX)
  displayName: string;

  @IsOptional()
  @ValidateIf((o) => o.fullName !== null)
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  fullName: string | null;

  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== null)
  @IsUrl()
  avatarUrl: string | null;

  @IsOptional()
  @ValidateIf((o) => o.school !== null)
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  school: string | null;

  @IsOptional()
  @ValidateIf((o) => o.location !== null)
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  location: string | null;

  @ValidateIf((o) => o.age !== null)
  @IsInt()
  @Min(VALIDATION.AGE_MIN)
  @Max(VALIDATION.AGE_MAX)
  age: number | null;
}
