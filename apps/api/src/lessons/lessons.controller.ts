import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonsService } from "./lessons.service";

@Controller("lessons")
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  async findMyLessons(@CurrentUser() user: JwtPayload) {
    const lessons = await this.lessonsService.findAllByAuthor(user.userId);
    return { ok: true, data: lessons };
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const lesson = await this.lessonsService.findOneById(id, user.userId);
    return { ok: true, data: lesson };
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLessonDto,
  ) {
    const lesson = await this.lessonsService.create(user.userId, dto.groupId);
    return { ok: true, data: lesson };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLessonDto,
  ) {
    const lesson = await this.lessonsService.update(id, user.userId, dto);
    return { ok: true, data: lesson };
  }
}
