import { IsArray } from "class-validator";

export class UpdatePublishGroupsDto {
  @IsArray()
  groupIds: string[];
}