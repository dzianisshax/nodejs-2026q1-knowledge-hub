import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommentRepository } from './comment.repository.interface';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';

@Injectable()
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): Comment {
    return {
      id: raw.id,
      content: raw.content,
      articleId: raw.articleId,
      authorId: raw.authorId,
      createdAt: raw.createdAt.getTime(),
    };
  }

  async findAllByArticleId(articleId: string): Promise<Comment[]> {
    const rows = await this.prisma.comment.findMany({ where: { articleId } });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Comment | null> {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    const row = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    await this.prisma.comment.deleteMany({ where: { articleId } });
  }

  async deleteByAuthorId(authorId: string): Promise<void> {
    await this.prisma.comment.deleteMany({ where: { authorId } });
  }
}
