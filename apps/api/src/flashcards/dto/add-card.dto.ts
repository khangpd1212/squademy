import { IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";

export class AddCardDto {
  @IsString()
  @IsNotEmpty()
  front!: string;

  @IsOptional()
  @IsString()
  back?: string;

  @IsOptional()
  @IsString()
  pronunciation?: string;

  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  extraNotes?: string;
}