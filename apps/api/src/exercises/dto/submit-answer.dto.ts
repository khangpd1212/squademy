import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class AnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  answer: string | string[];
}

export class SubmitAnswerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsInt()
  timeTaken: number;

  @IsOptional()
  @IsArray()
  focusEvents?: { type: string; timestamp: string }[];
}