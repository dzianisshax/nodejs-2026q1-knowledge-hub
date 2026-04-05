import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { InMemoryCommentRepository } from './repositories/comment.in-memory.repository';
import { COMMENT_REPOSITORY } from './repositories/comment.repository.interface';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule],
  controllers: [CommentController],
  providers: [
    CommentService,
    {
      provide: COMMENT_REPOSITORY,
      useClass: InMemoryCommentRepository,
    },
  ],
})
export class CommentModule {}
