import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Article, ArticleStatus } from '../entities/article.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import {
  ArticleFilterParams,
  IArticleRepository,
} from './article.repository.interface';

@Injectable()
export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articles: Map<string, Article> = new Map();

  findAll(filters: ArticleFilterParams = {}): Article[] {
    let result = Array.from(this.articles.values());

    if (filters.status) {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters.categoryId) {
      result = result.filter((a) => a.categoryId === filters.categoryId);
    }

    if (filters.tag) {
      result = result.filter((a) => a.tags.includes(filters.tag!));
    }

    return result;
  }

  findById(id: string): Article | null {
    return this.articles.get(id) ?? null;
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();
    const article: Article = {
      id: uuidv4(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.articles.set(article.id, article);
    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const existing = this.articles.get(id)!;
    const updated: Article = {
      ...existing,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.authorId !== undefined && { authorId: dto.authorId }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      updatedAt: Date.now(),
    };

    this.articles.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    this.articles.delete(id);
  }

  nullifyAuthorId(authorId: string): void {
    for (const [id, article] of this.articles) {
      if (article.authorId === authorId) {
        this.articles.set(id, { ...article, authorId: null });
      }
    }
  }

  nullifyCategoryId(categoryId: string): void {
    for (const [id, article] of this.articles) {
      if (article.categoryId === categoryId) {
        this.articles.set(id, { ...article, categoryId: null });
      }
    }
  }
}
