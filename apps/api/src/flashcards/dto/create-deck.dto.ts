import { VALIDATION } from "@squademy/shared";
import { IsString, IsOptional, MaxLength, MinLength, IsArray, ArrayMinSize } from "class-validator";

export class CreateDeckDto {
  @IsString()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  groupIds?: string[];
}