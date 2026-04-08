import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { VALIDATION } from "@squademy/shared";

export class CreateReviewCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lineRef: string;

  @IsString()
  @MinLength(1)
  @MaxLength(VALIDATION.REVIEW_COMMENT_BODY_MAX)
  body: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}