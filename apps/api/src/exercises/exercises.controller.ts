import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ExercisesService } from "./exercises.service";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";

@Controller("exercises")
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get(":exerciseId")
  async findOne(
    @Param("exerciseId") exerciseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const exercise = await this.exercisesService.findById(exerciseId, user.userId);
    return { ok: true, data: exercise };
  }

  @Get(":exerciseId/submissions")
  async findSubmissions(
    @Param("exerciseId") exerciseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const submissions = await this.exercisesService.findSubmissions(
      exerciseId,
      user.userId,
    );
    return { ok: true, data: submissions };
  }

  @Post(":exerciseId/submissions")
  async submit(
    @Param("exerciseId") exerciseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitAnswerDto,
  ) {
    const result = await this.exercisesService.submit(
      exerciseId,
      user.userId,
      dto,
    );
    return { ok: true, data: result };
  }
}