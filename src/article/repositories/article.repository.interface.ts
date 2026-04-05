import { Article } from '../entities/article.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

export const ARTICLE_REPOSITORY = Symbol('ARTICLE_REPOSITORY');

export interface ArticleFilterParams {
  status?: string;
  categoryId?: string;
  tag?: string;
}

export interface IArticleRepository {
  findAll(filters?: ArticleFilterParams): Article[];
  findById(id: string): Article | null;
  create(dto: CreateArticleDto): Article;
  update(id: string, dto: UpdateArticleDto): Article;
  delete(id: string): void;
  nullifyAuthorId(authorId: string): void;
  nullifyCategoryId(categoryId: string): void;
}
