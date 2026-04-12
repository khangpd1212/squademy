import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { GroupEditorGuard } from "../common/guards/group-editor.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { LessonCommentGuard } from "../common/guards/lesson-comment.guard";
import { ResourceOwnerGuard } from "../common/guards/resource-owner.guard";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { CreateReviewCommentDto } from "./dto/create-review-comment.dto";
import { RejectLessonDto } from "./dto/reject-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonsService } from "./lessons.service";
import { CreateReactionDto, CreateAliveTextInteractionDto, UpdateProgressDto } from "./dto/learning-path.dto";

@Controller("lessons")
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get("review-queue")
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

  @Get()
  async findMyLessons(@CurrentUser() user: JwtPayload) {
    const lessons = await this.lessonsService.findAllByAuthor(user.userId);
    return { ok: true, data: lessons };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const lesson = await this.lessonsService.findOneById(id, user.userId);
    return { ok: true, data: lesson };
  }

  @Get("group/:groupId")
  async findPublishedByGroup(@Param("groupId") groupId: string) {
    const lessons = await this.lessonsService.findPublishedByGroup(groupId);
    return { ok: true, data: lessons };
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLessonDto) {
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
    await this.lessonsService.deleteDraftLesson(id);
    return { ok: true };
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

  @Get(":lessonId/comments")
  @UseGuards(LessonCommentGuard)
  async findComments(@Param("lessonId") lessonId: string) {
    const comments = await this.lessonsService.getCommentsByLesson(lessonId);
    return { ok: true, data: comments };
  }

  @Post(":lessonId/comments")
  @UseGuards(LessonCommentGuard)
  async createComment(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewCommentDto,
  ) {
    const comment = await this.lessonsService.createComment(
      lessonId,
      user.userId,
      dto,
    );
    return { ok: true, data: comment };
  }

  @Delete(":lessonId/comments/:commentId")
  @UseGuards(LessonCommentGuard)
  async deleteComment(
    @Param("lessonId") lessonId: string,
    @Param("commentId") commentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.lessonsService.deleteComment(commentId, user.userId, lessonId);
    return { ok: true };
  }

  @Get(":lessonId/reactions")
  @UseGuards(LessonCommentGuard)
  async getReactions(@Param("lessonId") lessonId: string, @CurrentUser() user: JwtPayload) {
    const reactions = await this.lessonsService.getReactions(lessonId, user.userId);
    return { ok: true, data: reactions };
  }

  @Post(":lessonId/reactions")
  @UseGuards(LessonCommentGuard)
  async toggleReaction(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReactionDto,
  ) {
    const result = await this.lessonsService.toggleReaction(lessonId, user.userId, dto);
    return { ok: true, data: result };
  }

  @Post(":lessonId/interactions")
  @UseGuards(LessonCommentGuard)
  async recordInteraction(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAliveTextInteractionDto,
  ) {
    const result = await this.lessonsService.recordInteraction(lessonId, user.userId, dto);
    return { ok: true, data: result };
  }

  @Post(":lessonId/progress")
  @UseGuards(LessonCommentGuard)
  async updateProgress(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProgressDto,
  ) {
    const result = await this.lessonsService.updateProgress(lessonId, user.userId, dto);
    return { ok: true, data: result };
  }

  @Get(":lessonId/progress")
  @UseGuards(LessonCommentGuard)
  async getProgress(@Param("lessonId") lessonId: string, @CurrentUser() user: JwtPayload) {
    const progress = await this.lessonsService.getProgress(lessonId, user.userId);
    return { ok: true, data: progress };
  }

  @Patch(":id/soft-delete")
  @UseGuards(GroupEditorGuard)
  async softDelete(@Param("id") id: string) {
    const result = await this.lessonsService.softDeleteLesson(id);
    return { ok: true, data: result };
  }
}
