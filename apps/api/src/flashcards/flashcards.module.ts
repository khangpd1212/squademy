import { Module } from "@nestjs/common";
import { FlashcardsController } from "./flashcards.controller";
import { FlashcardsService } from "./flashcards.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
