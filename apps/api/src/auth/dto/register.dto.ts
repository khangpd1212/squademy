import { IsBoolean, IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";
import type { RegisterInput } from "@squademy/shared";

export class RegisterDto implements RegisterInput {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(VALIDATION.PASSWORD_MIN)
  @MaxLength(VALIDATION.PASSWORD_MAX)
  password: string;

  @IsString()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(VALIDATION.DISPLAY_NAME_MAX)
  displayName: string;

  @IsBoolean()
  acceptPrivacy: boolean;
}
