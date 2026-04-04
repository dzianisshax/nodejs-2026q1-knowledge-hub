import { Inject, Injectable } from '@nestjs/common';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  ARTICLE_REPOSITORY,
  ArticleFilterParams,
  IArticleRepository,
} from './repositories/article.repository.interface';

@Injectable()
export class ArticleService {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articleRepository: IArticleRepository,
  ) {}

  findAll(filters: ArticleFilterParams): Article[] {
    return this.articleRepository.findAll(filters);
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
    this.articleRepository.delete(id);
  }
}
