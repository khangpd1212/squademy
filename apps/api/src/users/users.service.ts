import { Injectable } from "@nestjs/common";
import { Prisma } from "@squademy/database";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async search(query: string) {
    return this.prisma.user.findMany({
      where: {
        displayName: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 20,
    });
  }
}
