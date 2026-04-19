import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  ARTICLE_REPOSITORY,
  ArticleFilterParams,
  IArticleRepository,
} from './repositories/article.repository.interface';
import { CommentService } from '../comment/comment.service';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { paginate } from '../common/helpers/paginate.helper';

@Injectable()
export class ArticleService {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articleRepository: IArticleRepository,
    @Inject(forwardRef(() => CommentService)) // forwardRef on the injected service
    private readonly commentService: CommentService,
  ) {}

  findAll(
    filters: ArticleFilterParams,
    page: number,
    limit: number,
  ): PaginatedResponseDto<Article> {
    return paginate(this.articleRepository.findAll(filters), page, limit);
  }

  findOne(id: string): Article | null {
    return this.articleRepository.findById(id);
  }

  create(dto: CreateArticleDto): Article {
    return this.articleRepository.create(dto);
  }

  update(id: string, dto: UpdateArticleDto): Article {
    return this.articleRepository.update(id, dto);
  }

  delete(id: string): void {
    this.commentService.removeByArticleId(id);
    this.articleRepository.delete(id);
  }

  nullifyAuthorId(authorId: string): void {
    this.articleRepository.nullifyAuthorId(authorId);
  }

  nullifyCategoryId(categoryId: string): void {
    this.articleRepository.nullifyCategoryId(categoryId);
  }
}
