import { IsBoolean, IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;

  @IsBoolean()
  acceptPrivacy: boolean;
}
