import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  MaxLength,
} from "class-validator";
import { VALIDATION } from "@squademy/shared";

export class AddCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  front!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  back?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pronunciation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  exampleSentence?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  extraNotes?: string;
}