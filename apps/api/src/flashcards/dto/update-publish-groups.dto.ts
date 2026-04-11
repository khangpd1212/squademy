import { IsArray, IsString } from "class-validator";

export class UpdatePublishGroupsDto {
  @IsArray()
  @IsString({ each: true })
  groupIds: string[];
}