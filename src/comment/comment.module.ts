import { Module, forwardRef } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PrismaCommentRepository } from './repositories/comment.prisma.repository';
import { COMMENT_REPOSITORY } from './repositories/comment.repository.interface';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [forwardRef(() => ArticleModule)],
  controllers: [CommentController],
  providers: [
    CommentService,
    { provide: COMMENT_REPOSITORY, useClass: PrismaCommentRepository },
  ],
  exports: [CommentService],
})
export class CommentModule {}
