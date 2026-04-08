import { Module } from "@nestjs/common";
import { LessonsController } from "./lessons.controller";
import { LessonsService } from "./lessons.service";
import { PrismaModule } from "../prisma/prisma.module";
import { LessonCommentGuard } from "../common/guards/lesson-comment.guard";

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonCommentGuard],
})
export class LessonsModule {}
