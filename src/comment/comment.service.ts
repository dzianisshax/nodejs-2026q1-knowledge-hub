import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  COMMENT_REPOSITORY,
  ICommentRepository,
} from './repositories/comment.repository.interface';
import { ArticleService } from '../article/article.service';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { paginate } from '../common/helpers/paginate.helper';

@Injectable()
export class CommentService {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    @Inject(forwardRef(() => ArticleService)) // forwardRef on the injected service
    private readonly articleService: ArticleService,
  ) {}

  findAllByArticleId(
    articleId: string,
    page: number,
    limit: number,
  ): PaginatedResponseDto<Comment> {
    return paginate(
      this.commentRepository.findAllByArticleId(articleId),
      page,
      limit,
    );
  }

  findOne(id: string): Comment | null {
    return this.commentRepository.findById(id);
  }

  create(dto: CreateCommentDto): Comment {
    const article = this.articleService.findOne(dto.articleId);

    if (!article) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} does not exist`,
      );
    }

    return this.commentRepository.create(dto);
  }

  delete(id: string): void {
    this.commentRepository.delete(id);
  }

  removeByArticleId(articleId: string): void {
    this.commentRepository.deleteByArticleId(articleId);
  }

  removeByAuthorId(authorId: string): void {
    this.commentRepository.deleteByAuthorId(authorId);
  }
}
