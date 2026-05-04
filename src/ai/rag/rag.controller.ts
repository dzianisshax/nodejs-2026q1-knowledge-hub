import {
  Controller, Post, Delete, Get, Body, Param, HttpCode, HttpStatus,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { validate as isUuid } from 'uuid';
import { RagService } from './rag.service';
import { ReindexDto } from './dto/reindex.dto';
import { RagSearchDto } from './dto/rag-search.dto';
import { RagChatDto } from './dto/rag-chat.dto';
import { AiRateLimitGuard } from '../guards/ai-rate-limit.guard';
import { BearerAuth } from '../../auth/decorators/bearer-auth.decorator';

@ApiTags('RAG')
@BearerAuth()
@UseGuards(AiRateLimitGuard)
@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  reindex(@Body() dto: ReindexDto) {
    return this.ragService.reindex(dto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body() dto: RagSearchDto) {
    return this.ragService.search(dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() dto: RagChatDto) {
    return this.ragService.chat(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFromIndex(@Param('articleId') articleId: string) {
    if (!isUuid(articleId)) {
      throw new BadRequestException(`articleId ${articleId} is invalid (not uuid)`);
    }
    await this.ragService.deleteArticleFromIndex(articleId);
  }

  @Get('chat/:conversationId/history')
  @HttpCode(HttpStatus.OK)
  getHistory(@Param('conversationId') conversationId: string) {
    return this.ragService.getConversationHistory(conversationId);
  }
}