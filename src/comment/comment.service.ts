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

  async findAllByArticleId(
    articleId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Comment>> {
    return paginate(
      await this.commentRepository.findAllByArticleId(articleId),
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<Comment | null> {
    return this.commentRepository.findById(id);
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    const article = await this.articleService.findOne(dto.articleId);

    if (!article) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} does not exist`,
      );
    }

    return this.commentRepository.create(dto);
  }

  async delete(id: string): Promise<void> {
    await this.commentRepository.delete(id);
  }

  async removeByArticleId(articleId: string): Promise<void> {
    await this.commentRepository.deleteByArticleId(articleId);
  }

  async removeByAuthorId(authorId: string): Promise<void> {
    await this.commentRepository.deleteByAuthorId(authorId);
  }
}
