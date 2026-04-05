import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { InMemoryArticleRepository } from './repositories/article.in-memory.repository';
import { ARTICLE_REPOSITORY } from './repositories/article.repository.interface';

@Module({
  controllers: [ArticleController],
  providers: [
    ArticleService,
    {
      provide: ARTICLE_REPOSITORY,
      useClass: InMemoryArticleRepository,
    },
  ],
  exports: [ArticleService],
})
export class ArticleModule {}
