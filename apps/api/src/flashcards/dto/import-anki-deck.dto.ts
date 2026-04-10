import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { VALIDATION } from "@squademy/shared";
import { AddCardDto } from "./add-card.dto";

export class ImportAnkiDeckDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.DISPLAY_NAME_MIN)
  @MaxLength(100)
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddCardDto)
  cards!: AddCardDto[];
}