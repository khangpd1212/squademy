import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { VALIDATION } from "@squademy/shared";

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(VALIDATION.LESSON_TITLE_MIN)
  @MaxLength(VALIDATION.LESSON_TITLE_MAX)
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.content !== null)
  @IsObject()
  content?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.LESSON_CONTENT_MARKDOWN_MAX)
  contentMarkdown?: string;
}
