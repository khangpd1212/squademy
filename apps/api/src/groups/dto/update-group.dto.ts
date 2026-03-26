import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  exerciseDeadlineDay?: number;

  @IsOptional()
  @IsString()
  exerciseDeadlineTime?: string;
}
