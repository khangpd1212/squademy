import { Module } from "@nestjs/common";
import { SrsProgressController } from "./srs-progress.controller";
import { SrsProgressService } from "./srs-progress.service";

@Module({
  controllers: [SrsProgressController],
  providers: [SrsProgressService],
  exports: [SrsProgressService],
})
export class SrsProgressModule {}