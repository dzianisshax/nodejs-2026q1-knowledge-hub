import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './services/gemini.service';
import { AiCacheService } from './services/ai-cache.service';
import { AiUsageService } from './services/ai-usage.service';
import { SessionService } from './services/session.service';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    AiCacheService,
    AiUsageService,
    SessionService,
  ],
})
export class AiModule {}
