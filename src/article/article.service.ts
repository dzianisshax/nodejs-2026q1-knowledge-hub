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

  async findAll(
    filters: ArticleFilterParams,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Article>> {
    return paginate(await this.articleRepository.findAll(filters), page, limit);
  }

  async findOne(id: string): Promise<Article | null> {
    return this.articleRepository.findById(id);
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    return this.articleRepository.create(dto);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    return this.articleRepository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.commentService.removeByArticleId(id);
    await this.articleRepository.delete(id);
  }

  async nullifyAuthorId(authorId: string): Promise<void> {
    await this.articleRepository.nullifyAuthorId(authorId);
  }

  async nullifyCategoryId(categoryId: string): Promise<void> {
    await this.articleRepository.nullifyCategoryId(categoryId);
  }
}
