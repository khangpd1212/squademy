import { VALIDATION } from "@squademy/shared";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(100)
  title!: string;
}