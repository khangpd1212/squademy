import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";
import type { LoginInput } from "@squademy/shared";

export class LoginDto implements LoginInput {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(VALIDATION.PASSWORD_MIN)
  @MaxLength(VALIDATION.PASSWORD_MAX)
  password: string;
}
