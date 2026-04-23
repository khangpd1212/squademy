import { Controller, Get } from "@nestjs/common";

@Controller("version")
export class VersionController {
  @Get()
  getVersion() {
    return {
      version: "1.0.3",
      buildDate: "2026-04-23",
      status: "ok",
    };
  }
}