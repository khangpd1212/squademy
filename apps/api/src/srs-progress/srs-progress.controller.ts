import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SrsProgressService } from "./srs-progress.service";

class RecordGradeDto {
  deckId!: string;
  cardId!: string;
  grade!: number;
}

class RecordGradesDto {
  grades!: { deckId: string; cardId: string; grade: number }[];
}

@Controller("srs-progress")
@UseGuards(JwtAuthGuard)
export class SrsProgressController {
  constructor(private readonly srsProgressService: SrsProgressService) {}

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