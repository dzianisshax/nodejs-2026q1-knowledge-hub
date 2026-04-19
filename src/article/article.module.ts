import { Module, forwardRef } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { PrismaArticleRepository } from './repositories/article.prisma.repository';
import { ARTICLE_REPOSITORY } from './repositories/article.repository.interface';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [forwardRef(() => CommentModule)],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    { provide: ARTICLE_REPOSITORY, useClass: PrismaArticleRepository },
  ],
  exports: [ArticleService],
})
export class ArticleModule {}
