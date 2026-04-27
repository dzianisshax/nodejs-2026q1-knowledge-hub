import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { validate as isUuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import { BearerAuth } from '../auth/decorators/bearer-auth.decorator';

@ApiTags('AI')
@BearerAuth()
@UseGuards(AiRateLimitGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  private validateArticleId(id: string) {
    if (!isUuid(id))
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
  }

  @Post('articles/:articleId/summarize')
  @HttpCode(HttpStatus.OK)
  summarize(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    this.validateArticleId(articleId);
    return this.aiService.summarize(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  @HttpCode(HttpStatus.OK)
  translate(
    @Param('articleId') articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    this.validateArticleId(articleId);
    return this.aiService.translate(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  @HttpCode(HttpStatus.OK)
  analyze(
    @Param('articleId') articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    this.validateArticleId(articleId);
    return this.aiService.analyze(articleId, dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(@Body() dto: GenerateDto) {
    return this.aiService.generate(dto);
  }

  @Get('usage')
  @HttpCode(HttpStatus.OK)
  usage() {
    return this.aiService.getUsageStats();
  }
}
