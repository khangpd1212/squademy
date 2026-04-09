import { IsOptional, IsString, IsBoolean, IsArray, IsEnum } from "class-validator";
import { ReactionType, AliveTextInteractionType } from "@squademy/shared";

export class AddLearningPathItemDto {
  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  deckId?: string;
}

export class ReorderLearningPathDto {
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];
}

export class CreateReactionDto {
  @IsString()
  lineRef: string;

  @IsEnum(ReactionType)
  reactionType: ReactionType;
}

export class CreateAliveTextInteractionDto {
  @IsString()
  blockId: string;

  @IsEnum(AliveTextInteractionType)
  interactionType: AliveTextInteractionType;
}

export class UpdateProgressDto {
  @IsBoolean()
  isRead: boolean;
}