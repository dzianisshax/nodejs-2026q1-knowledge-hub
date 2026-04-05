import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ICommentRepository } from './comment.repository.interface';

@Injectable()
export class InMemoryCommentRepository implements ICommentRepository {
  private readonly comments: Map<string, Comment> = new Map();

  findAllByArticleId(articleId: string): Comment[] {
    return Array.from(this.comments.values()).filter(
      (c) => c.articleId === articleId,
    );
  }

  findById(id: string): Comment | null {
    return this.comments.get(id) ?? null;
  }

  create(dto: CreateCommentDto): Comment {
    const comment: Comment = {
      id: uuidv4(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: Date.now(),
    };

    this.comments.set(comment.id, comment);
    return comment;
  }

  delete(id: string): void {
    this.comments.delete(id);
  }
}
