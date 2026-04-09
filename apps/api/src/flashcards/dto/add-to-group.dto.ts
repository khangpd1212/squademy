import { IsString } from "class-validator";

export class AddToGroupDto {
  @IsString()
  groupId!: string;
}