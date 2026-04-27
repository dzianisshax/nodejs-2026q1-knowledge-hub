import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { GeminiService } from './services/gemini.service';
import { AiCacheService } from './services/ai-cache.service';
import { AiUsageService } from './services/ai-usage.service';
import { SessionService } from './services/session.service';
import { ArticleService } from '../article/article.service';
import { PROMPTS } from './prompts/article.prompts';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import { validateShape } from './validation/ai-response.validator';
import {
  TRANSLATE_SCHEMA,
  ANALYZE_SCHEMA,
} from './validation/ai-response.schemas';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly cache: AiCacheService,
    private readonly usage: AiUsageService,
    private readonly sessions: SessionService,
    private readonly articleService: ArticleService,
  ) {}

  private async getArticleOrThrow(articleId: string) {
    const article = await this.articleService.findOne(articleId);
    if (!article)
      throw new NotFoundException(`Article with id ${articleId} not found`);
    return article;
  }

  async summarize(articleId: string, dto: SummarizeArticleDto) {
    const article = await this.getArticleOrThrow(articleId);
    const maxLength = dto.maxLength ?? 'medium';

    const cacheKey = this.cache.buildKey({
      articleId,
      maxLength,
      updatedAt: article.updatedAt,
    });
    const cached = this.cache.get<object>(cacheKey);
    if (cached) {
      this.usage.track('summarize'); // cache hit — no latency, no tokens
      return cached;
    }

    const prompt = PROMPTS.summarize(article.content, maxLength);

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.usage.track('summarize', 0, 0, true); // isError = true
      throw err;
    }

    const { text, tokens, latencyMs } = geminiResult;
    this.usage.track('summarize', tokens, latencyMs);

    const summary = text.trim();
    const result = {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async translate(articleId: string, dto: TranslateArticleDto) {
    if (!dto.targetLanguage)
      throw new BadRequestException('targetLanguage is required');

    const article = await this.getArticleOrThrow(articleId);

    const cacheKey = this.cache.buildKey({
      articleId,
      targetLanguage: dto.targetLanguage,
      sourceLanguage: dto.sourceLanguage ?? '',
      updatedAt: article.updatedAt,
    });

    const cached = this.cache.get<object>(cacheKey);
    if (cached) {
      this.usage.track('translate');
      return cached;
    }

    const prompt = PROMPTS.translate(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.usage.track('translate', 0, 0, true);
      throw err;
    }

    const { text, tokens, latencyMs } = geminiResult;
    this.usage.track('translate', tokens, latencyMs);

    const parsed = this.gemini.parseJson<{
      translatedText: string;
      detectedLanguage: string;
    }>(text);
    const validated = validateShape(parsed, TRANSLATE_SCHEMA, {
      translatedText: text.trim(),
      detectedLanguage: 'unknown',
    });

    const result = { articleId, ...validated };
    this.cache.set(cacheKey, result);
    return result;
  }

  async analyze(articleId: string, dto: AnalyzeArticleDto) {
    const article = await this.getArticleOrThrow(articleId);
    const task = dto.task ?? 'review';

    const prompt = PROMPTS.analyze(article.content, task);

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.usage.track('analyze', 0, 0, true);
      throw err;
    }

    const { text, tokens, latencyMs } = geminiResult;
    this.usage.track('analyze', tokens, latencyMs);

    const parsed = this.gemini.parseJson<{
      analysis: string;
      suggestions: string[];
      severity: 'info' | 'warning' | 'error';
    }>(text);

    const validated = validateShape(parsed, ANALYZE_SCHEMA, {
      analysis: text.trim(),
      suggestions: [],
      severity: 'info' as const,
    });

    return { articleId, ...validated };
  }

  async generate(dto: GenerateDto) {
    const sessionId = dto.sessionId;
    const history = sessionId ? this.sessions.getHistory(sessionId) : [];
    const prompt = PROMPTS.generate(dto.prompt, history);

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.usage.track('generate', 0, 0, true);
      throw err;
    }

    const { text, tokens, latencyMs } = geminiResult;
    this.usage.track('generate', tokens, latencyMs);

    if (sessionId) {
      this.sessions.append(sessionId, 'user', dto.prompt);
      this.sessions.append(sessionId, 'assistant', text.trim());
    }

    return { text: text.trim(), sessionId: sessionId ?? null };
  }

  getUsageStats() {
    return {
      usage: this.usage.getStats(),
      cache: this.cache.stats(),
    };
  }
}
