import { Article, ArticleStatus } from '../entities/article.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

export const ARTICLE_REPOSITORY = Symbol('ARTICLE_REPOSITORY');

export interface ArticleFilterParams {
  status?: ArticleStatus;
  categoryId?: string;
  tag?: string;
}

export interface IArticleRepository {
  findAll(filters?: ArticleFilterParams): Promise<Article[]>;
  findById(id: string): Promise<Article | null>;
  create(dto: CreateArticleDto): Promise<Article>;
  update(id: string, dto: UpdateArticleDto): Promise<Article>;
  delete(id: string): Promise<void>;
  nullifyAuthorId(authorId: string): Promise<void>;
  nullifyCategoryId(categoryId: string): Promise<void>;
}
