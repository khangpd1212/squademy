import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ResourceOwnerGuard } from "../common/guards/resource-owner.guard";
import { GroupEditorGuard } from "../common/guards/group-editor.guard";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { RejectLessonDto } from "./dto/reject-lesson.dto";
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

  @Patch(":id/submit")
  @UseGuards(ResourceOwnerGuard)
  async submit(@Param("id") id: string) {
    const lesson = await this.lessonsService.submit(id);
    return { ok: true, data: lesson };
  }

  @Delete(":id")
  @UseGuards(ResourceOwnerGuard)
  async delete(@Param("id") id: string) {
    await this.lessonsService.deleteLesson(id);
    return { ok: true };
  }

  @Get("review-queue")
  @UseGuards(JwtAuthGuard)
  async findReviewQueue(@CurrentUser() user: JwtPayload) {
    const lessons = await this.lessonsService.findReviewQueue(user.userId);
    return { ok: true, data: lessons };
  }

  @Get("review/:id")
  @UseGuards(GroupEditorGuard)
  async findReviewDetail(@Param("id") id: string) {
    const lesson = await this.lessonsService.findReviewDetail(id);
    return { ok: true, data: lesson };
  }

  @Patch(":id/approve")
  @UseGuards(GroupEditorGuard)
  async approve(@Param("id") id: string) {
    const lesson = await this.lessonsService.approveLesson(id);
    return { ok: true, data: lesson };
  }

  @Patch(":id/reject")
  @UseGuards(GroupEditorGuard)
  async reject(@Param("id") id: string, @Body() dto: RejectLessonDto) {
    const lesson = await this.lessonsService.rejectLesson(id, dto.feedback);
    return { ok: true, data: lesson };
  }
}
