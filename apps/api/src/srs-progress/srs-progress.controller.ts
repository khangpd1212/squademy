import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { IsString, IsInt, Min, Max } from "class-validator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SrsProgressService } from "./srs-progress.service";

class RecordGradeDto {
  @IsString()
  deckId!: string;

  @IsString()
  cardId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  grade!: number;
}

class RecordGradesDto {
  grades!: { deckId: string; cardId: string; grade: number }[];
}

@Controller("srs-progress")
@UseGuards(JwtAuthGuard)
export class SrsProgressController {
  constructor(private readonly srsProgressService: SrsProgressService) {}

  @Get("due")
  async getDueCards(
    @CurrentUser() user: JwtPayload,
    @Query("deckId") deckId?: string,
  ) {
    return this.srsProgressService.getDueCards(user.userId, deckId);
  }

  @Get("ahead")
  async getAheadCards(
    @CurrentUser() user: JwtPayload,
    @Query("deckId") deckId?: string,
  ) {
    return this.srsProgressService.getAheadCards(user.userId, deckId);
  }

  @Post()
  async recordGrade(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordGradeDto,
  ) {
    return this.srsProgressService.recordGrade(user.userId, dto);
  }

  @Post("batch")
  async recordGrades(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordGradesDto,
  ) {
    return this.srsProgressService.recordGrades(user.userId, dto.grades);
  }
}