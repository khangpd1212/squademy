import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.findById(user.userId);
    if (!profile) {
      return { ok: false, error: "User not found" };
    }
    return {
      ok: true,
      data: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        school: profile.school,
        location: profile.location,
        age: profile.age,
      },
    };
  }

  @Patch("me")
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(user.userId, dto);
    return {
      ok: true,
      data: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
        school: updated.school,
        location: updated.location,
        age: updated.age,
      },
    };
  }

  @Get("search")
  async search(@Query("q") query: string) {
    const users = await this.usersService.search(query || "");
    return { ok: true, data: users };
  }
}
