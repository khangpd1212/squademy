import {
  Body,
  Controller,
  Delete,
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
import { AddCardDto } from "./dto/add-card.dto";
import { CreateDeckDto } from "./dto/create-deck.dto";
import { ImportAnkiDeckDto } from "./dto/import-anki-deck.dto";
import { FlashcardsService } from "./flashcards.service";

@Controller("flashcard-decks")
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    const decks = await this.flashcardsService.findAllByAuthor(user.userId);
    return { ok: true, data: decks };
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDeckDto) {
    const deck = await this.flashcardsService.create(user.userId, dto);
    return { ok: true, data: deck };
  }

  @Post("import")
  async importAnki(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ImportAnkiDeckDto,
  ) {
    const deck = await this.flashcardsService.importAnki(user.userId, dto);
    return { ok: true, data: deck };
  }

  @Post(":deckId/cards")
  async addCard(
    @Param("deckId") deckId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddCardDto,
  ) {
    const card = await this.flashcardsService.addCard(deckId, user.userId, dto);
    return { ok: true, data: card };
  }

  @Get(":deckId")
  async findOne(
    @Param("deckId") deckId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const deck = await this.flashcardsService.findOne(deckId, user.userId);
    return { ok: true, data: deck };
  }

  @Delete(":deckId")
  async delete(
    @Param("deckId") deckId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.flashcardsService.delete(deckId, user.userId);
    return { ok: true, data: { success: true } };
  }
}
