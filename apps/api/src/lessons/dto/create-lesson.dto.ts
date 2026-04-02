import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CreateLessonDto {
  @IsNotEmpty()
  @IsUUID()
  @MaxLength(36)
  groupId: string;
}
