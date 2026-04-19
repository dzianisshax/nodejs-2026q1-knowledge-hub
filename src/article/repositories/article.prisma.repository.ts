import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IArticleRepository,
  ArticleFilterParams,
} from './article.repository.interface';
import { Article, ArticleStatus } from '../entities/article.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

const INCLUDE_TAGS = { tags: true } as const;

@Injectable()
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): Article {
    return {
      id: raw.id,
      title: raw.title,
      content: raw.content,
      status: raw.status as ArticleStatus,
      authorId: raw.authorId,
      categoryId: raw.categoryId,
      tags: (raw.tags ?? []).map((t: { name: string }) => t.name),
      createdAt: raw.createdAt.getTime(),
      updatedAt: raw.updatedAt.getTime(),
    };
  }

  async findAll(filters: ArticleFilterParams = {}): Promise<Article[]> {
    const where: Prisma.ArticleWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tag) where.tags = { some: { name: filters.tag } };

    const rows = await this.prisma.article.findMany({
      where,
      include: INCLUDE_TAGS,
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Article | null> {
    const row = await this.prisma.article.findUnique({
      where: { id },
      include: INCLUDE_TAGS,
    });
    return row ? this.toEntity(row) : null;
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    const row = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: dto.status ?? ArticleStatus.DRAFT,
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: {
          connectOrCreate: (dto.tags ?? []).map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: INCLUDE_TAGS,
    });
    return this.toEntity(row);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const row = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.authorId !== undefined && { authorId: dto.authorId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags !== undefined && {
          tags: {
            set: [],
            connectOrCreate: dto.tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: INCLUDE_TAGS,
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  async nullifyAuthorId(authorId: string): Promise<void> {
    await this.prisma.article.updateMany({
      where: { authorId },
      data: { authorId: null },
    });
  }

  async nullifyCategoryId(categoryId: string): Promise<void> {
    await this.prisma.article.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });
  }
}
