import { IsString, MinLength, MaxLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";

export class RejectLessonDto {
  @IsString()
  @MinLength(1)
  @MaxLength(VALIDATION.PROFILE_FIELD_MAX)
  feedback: string;
}
